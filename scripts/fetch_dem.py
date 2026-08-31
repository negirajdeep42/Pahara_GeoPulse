"""Fetch a real elevation surface for NE India.

Two providers, selected with --source (default: opentopodata):

  opentopodata  SRTM 30 m. 1000 calls/day, 1 call/s, 100 locations per call.
  open-meteo    Copernicus DEM GLO-90. Higher throughput, but its rolling
                hourly cap is easy to exhaust.

Both return the same lattice, so the choice is recorded in the cache and
reported downstream rather than silently mixed.

Samples a 0.025 deg lattice over the study bbox. The 0.05 deg prediction grid is
built from this by 2x2 aggregation, so slope is computed on a ~2.8 km baseline
rather than a heavily smoothed 5.5 km one.

The bbox is a rectangle, but the modelled area is not: it is the eight states the
GSI inventory covers. Sampling the whole rectangle would spend about 70% of the
request budget on the Bay of Bengal, Bhutan, Bangladesh and Myanmar - all of which
are discarded later anyway. So the lattice is masked to those states first, dilated
by a two-sample margin so that slope at a state edge is still computed from real
neighbouring elevations rather than from fill values.

Open-Meteo's free tier enforces a per-minute request cap, so requests go through a
token bucket and a 429 parks every worker until the window rolls over. Progress is
checkpointed, so a re-run only fetches what is still missing.
"""
import os, sys, time, threading
import numpy as np
import requests
from concurrent.futures import ThreadPoolExecutor

LAT_MIN, LAT_MAX = 21.5, 29.6
LON_MIN, LON_MAX = 87.8, 97.5
COARSE = 0.05
FINE = COARSE / 2
BATCH = 100                  # both providers cap a request at 100 coordinates

SOURCES = {
    'opentopodata': {
        'label': 'OpenTopoData SRTM 30 m',
        'workers': 1,            # public instance allows 1 call/second
        'rate_per_min': 55,
    },
    'open-meteo': {
        'label': 'Open-Meteo Elevation API (Copernicus DEM GLO-90)',
        'workers': 3,
        'rate_per_min': 200,
    },
}
SOURCE = os.environ.get('SIH_DEM_SOURCE', 'opentopodata')
for _i, _a in enumerate(sys.argv):
    if _a == '--source' and _i + 1 < len(sys.argv):
        SOURCE = sys.argv[_i + 1]
if SOURCE not in SOURCES:
    raise SystemExit(f'unknown --source {SOURCE!r}; choose from {list(SOURCES)}')
WORKERS = SOURCES[SOURCE]['workers']
RATE_PER_MIN = SOURCES[SOURCE]['rate_per_min']
RETRIES = 25          # each retry parks on the rolling-window backoff above
MASK_MARGIN = 2              # fine samples of padding beyond the state edge
INVENTORY_STATES = (
    'Assam', 'Meghalaya', 'Manipur', 'Mizoram',
    'Nagaland', 'Arunachal Pradesh', 'Sikkim', 'Tripura',
)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(os.environ.get('SIH_CACHE_DIR') or os.path.join(ROOT, 'data', 'cache'), 'dem_fine_0025.npz')

n_lat_c = int(round((LAT_MAX - LAT_MIN) / COARSE))
n_lon_c = int(round((LON_MAX - LON_MIN) / COARSE))
fine_lats = LAT_MIN + FINE / 2 + np.arange(n_lat_c * 2) * FINE
fine_lons = LON_MIN + FINE / 2 + np.arange(n_lon_c * 2) * FINE
LATG, LONG = np.meshgrid(fine_lats, fine_lons, indexing='ij')
flat_lat, flat_lon = LATG.ravel(), LONG.ravel()
N = flat_lat.size
n_batches = (N + BATCH - 1) // BATCH

print(f'source      : {SOURCES[SOURCE]["label"]}', flush=True)
print(f'coarse grid : {n_lat_c} x {n_lon_c} = {n_lat_c*n_lon_c:,} prediction cells @ {COARSE} deg', flush=True)
print(f'fine sample : {LATG.shape[0]} x {LATG.shape[1]} = {N:,} elevation points @ {FINE} deg', flush=True)
print(f'batches     : {n_batches:,} requests, {WORKERS} workers, capped at {RATE_PER_MIN}/min', flush=True)
print(f'est runtime : ~{n_batches/RATE_PER_MIN:.1f} min if uninterrupted', flush=True)

# ------------------------------------------------- mask to the modelled states
def state_mask():
    """Boolean mask over the fine lattice: samples worth spending a request on."""
    import json
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import build_grid as bg

    cache_dir = os.path.dirname(CACHE)
    states_path = os.path.join(cache_dir, 'osm_states.json')
    if not os.path.exists(states_path):
        print('no cached state boundaries - sampling the whole bbox', flush=True)
        return np.ones((fine_lats.size, fine_lons.size), dtype=bool)

    keep = {s.strip().lower() for s in INVENTORY_STATES}
    polys = [p for p in bg.build_polys(states_path) if p['name'].strip().lower() in keep]
    if not polys:
        print('no matching state polygons - sampling the whole bbox', flush=True)
        return np.ones((fine_lats.size, fine_lons.size), dtype=bool)

    named = bg.assign(polys, flat_lon, flat_lat, 'dem-mask')
    m = (named != None).reshape(fine_lats.size, fine_lons.size)  # noqa: E711

    # dilate by MARGIN samples so gradients at the edge see real data
    out = m.copy()
    for _ in range(MASK_MARGIN):
        p = np.pad(out, 1, constant_values=False)
        out = (p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | out)
    print('mask: %s of %s samples inside the %d modelled states (+%d margin) = %.1f%%'
          % (format(int(out.sum()), ','), format(out.size, ','), len(polys),
             MASK_MARGIN, 100 * out.sum() / out.size), flush=True)
    return out


MASK = state_mask()
flat_mask = MASK.ravel()
wanted = np.flatnonzero(flat_mask)
n_batches = (wanted.size + BATCH - 1) // BATCH
print('requests    : %s (was %s for the full rectangle)'
      % (format(n_batches, ','), format((N + BATCH - 1) // BATCH, ',')), flush=True)

elev = np.full(N, np.nan, dtype='float32')
done = np.zeros(n_batches, dtype=bool)
if os.path.exists(CACHE):
    z = np.load(CACHE)
    if z['elev'].size == N:
        elev, done = z['elev'], z['done']
        print(f'resuming: {done.sum():,}/{n_batches:,} batches already cached', flush=True)


class RateLimiter:
    """Token bucket shared across worker threads."""
    def __init__(self, per_min):
        self.interval = 60.0 / per_min
        self.lock = threading.Lock()
        self.next_at = time.monotonic()

    def acquire(self):
        with self.lock:
            now = time.monotonic()
            wait = max(0.0, self.next_at - now)
            self.next_at = max(now, self.next_at) + self.interval
        if wait:
            time.sleep(wait)

    def park(self, seconds):
        """A 429 means the whole window is spent - push every worker back."""
        with self.lock:
            self.next_at = max(self.next_at, time.monotonic() + seconds)


limiter = RateLimiter(RATE_PER_MIN)
session = requests.Session()
session.headers['User-Agent'] = 'NE-India-landslide-susceptibility/1.0 (research)'
stats = {'ok': int(done.sum()), 'fail': 0, 'throttled': 0}
t0 = time.time()


def fetch(bi):
    idx = wanted[bi * BATCH: (bi + 1) * BATCH]
    payload = {
        'latitude': ','.join(f'{v:.5f}' for v in flat_lat[idx]),
        'longitude': ','.join(f'{v:.5f}' for v in flat_lon[idx]),
    }
    for attempt in range(RETRIES):
        limiter.acquire()
        try:
            if SOURCE == 'opentopodata':
                locs = '|'.join(f'{a:.5f},{b:.5f}'
                                for a, b in zip(flat_lat[idx], flat_lon[idx]))
                r = session.post('https://api.opentopodata.org/v1/srtm30m',
                                 data={'locations': locs}, timeout=90)
                if r.status_code == 200:
                    res = r.json().get('results') or []
                    # SRTM has voids over some high terrain; a null is a real
                    # gap, not a failed request, so it stays NaN
                    return bi, np.asarray(
                        [np.nan if x.get('elevation') is None else x['elevation'] for x in res],
                        dtype='float32')
            else:
                r = session.post('https://api.open-meteo.com/v1/elevation',
                                 data=payload, timeout=60)
                if r.status_code == 200:
                    return bi, np.asarray(r.json()['elevation'], dtype='float32')
            if r.status_code == 429:
                stats['throttled'] += 1
                # the free tier has separate minutely and hourly caps; an hourly
                # 429 will not clear for a whole clock hour, so park until it does
                # Both caps are ROLLING windows, not clock-aligned buckets, so
                # capacity frees up continuously. Park briefly and retry rather
                # than sitting out the rest of an hour.
                wait = 120 if ('Hourly' in r.text or 'Daily' in r.text) else 62
                if stats['throttled'] % 10 == 1:
                    print(f'  throttled ({r.text[:60]}) - backing off {wait}s',
                          flush=True)
                limiter.park(wait)
                continue
            if r.status_code in (500, 502, 503, 504):
                time.sleep(2 ** attempt)
                continue
            print(f'  batch {bi}: HTTP {r.status_code} {r.text[:100]}', flush=True)
            return bi, None
        except Exception:
            time.sleep(1.5 * (attempt + 1))
    return bi, None


def checkpoint():
    # savez_compressed appends '.npz' to whatever name it is given, so the
    # file it actually writes is tmp + '.npz', not tmp
    tmp = CACHE + '.tmp'
    np.savez_compressed(tmp, elev=elev, done=done, fine_lats=fine_lats,
                        fine_lons=fine_lons, mask=MASK,
                        source=np.array(SOURCES[SOURCE]['label']))
    os.replace(tmp + '.npz', CACHE)


todo = [i for i in range(n_batches) if not done[i]]
if not todo:
    print('cache already complete - nothing to fetch', flush=True)
else:
    with ThreadPoolExecutor(max_workers=WORKERS) as ex:
        for k, (bi, vals) in enumerate(ex.map(fetch, todo), 1):
            if vals is not None:
                elev[wanted[bi * BATCH: bi * BATCH + vals.size]] = vals
                done[bi] = True
                stats['ok'] += 1
            else:
                stats['fail'] += 1
            if k % 50 == 0 or k == len(todo):
                el = time.time() - t0
                rate = k / el if el else 0
                eta = (len(todo) - k) / rate if rate else 0
                print(f'  {k:,}/{len(todo):,}  ok={stats["ok"]:,} fail={stats["fail"]:,} '
                      f'throttled={stats["throttled"]:,}  {rate*60:.0f} req/min  eta {eta/60:.1f} min', flush=True)
                checkpoint()

checkpoint()
ok = int(done.sum())
got = int(np.isfinite(elev).sum())
print(f'\nDEM fetch: {ok:,}/{n_batches:,} batches, {got:,}/{N:,} points ({100*got/N:.2f}%)', flush=True)
if ok < n_batches:
    print(f'WARNING: {n_batches-ok} batches still missing - re-run to fill the gaps', flush=True)
    sys.exit(2)
e = elev[np.isfinite(elev)]
print(f'elevation: {e.min():.0f} .. {e.max():.0f} m   mean {e.mean():.0f} m', flush=True)
print(f'cache: {CACHE} ({os.path.getsize(CACHE)/1e6:.1f} MB)', flush=True)
