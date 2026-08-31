"""Build the 0.05 deg prediction grid for NE India from the cached DEM samples.

Elevation is sampled at 0.025 deg; slope, aspect and curvature are computed on that
fine lattice (a ~2.8 km baseline) and then aggregated 2x2 into the 0.05 deg
prediction cells, so slope is not smoothed away by the coarser cell size.

State and district are assigned by point-in-polygon against OSM admin boundaries
(the supplied CSVs contain neither), using a vectorised even-odd ray cast - no
shapely in this environment.
"""
import os, sys, json, warnings
import numpy as np
import pandas as pd

LAT_MIN, LAT_MAX = 21.5, 29.6
LON_MIN, LON_MAX = 87.8, 97.5
COARSE = 0.05
FINE = COARSE / 2
M_PER_DEG = 111320.0
BROADCAST_BUDGET = 2e7   # max elements in one point-in-polygon intermediate

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.environ.get('SIH_CACHE_DIR') or os.path.join(ROOT, 'data', 'cache')
DEM_NPZ = os.path.join(CACHE, 'dem_fine_0025.npz')
OUT = os.path.join(CACHE, 'grid_ne_005.csv')


def die(msg):
    print("\nERROR: " + msg, file=sys.stderr)
    sys.exit(1)


# ---------------------------------------------------------------- fine DEM
def load_fine_dem():
    if not os.path.exists(DEM_NPZ):
        die("DEM cache not found at %s. Run scripts/fetch_dem.py first." % DEM_NPZ)
    z = np.load(DEM_NPZ)
    elev, done = z['elev'], z['done']
    fine_lats, fine_lons = z['fine_lats'], z['fine_lons']
    ny, nx = fine_lats.size, fine_lons.size
    if elev.size != ny * nx:
        die("DEM cache shape mismatch: %d values for a %dx%d lattice" % (elev.size, ny, nx))
    missing = int(done.size - done.sum())
    if missing:
        die("DEM cache incomplete: %d of %d batches missing. "
            "Re-run scripts/fetch_dem.py to fill the gaps." % (missing, done.size))
    E = elev.reshape(ny, nx).astype('float64')
    # The fetcher only samples inside the modelled states (plus a margin), so
    # everything else is legitimately NaN rather than a failed request.
    mask = z['mask'] if 'mask' in z.files else np.isfinite(E)
    nan_inside = int(np.isnan(E[mask]).sum())
    print("fine DEM   : %d x %d = %s samples @ %s deg"
          % (ny, nx, format(E.size, ','), FINE))
    print("             sampled %s (%.1f%% of the rectangle), %s NaN inside the mask"
          % (format(int(mask.sum()), ','), 100 * mask.sum() / mask.size,
             format(nan_inside, ',')))
    print("             elevation %.0f .. %.0f m" % (np.nanmin(E), np.nanmax(E)))
    return E, fine_lats, fine_lons, mask


# ------------------------------------------------------- terrain derivatives
def terrain_derivatives(E, lats, lons):
    """Slope / aspect / curvature on the fine lattice, in metric units."""
    # north-south spacing is constant; east-west shrinks with cos(latitude)
    dy = FINE * M_PER_DEG
    dx = FINE * M_PER_DEG * np.cos(np.radians(lats))[:, None]

    Ef = np.where(np.isnan(E), np.nanmean(E), E)
    dzdy, dzdx = np.gradient(Ef, edge_order=1)
    dzdy = dzdy / dy
    dzdx = dzdx / dx

    mag = np.hypot(dzdx, dzdy)
    slope = np.degrees(np.arctan(mag))
    # geographic aspect: 0 = north, increasing clockwise
    aspect = (np.degrees(np.arctan2(-dzdx, dzdy)) + 360.0) % 360.0
    aspect = np.where(mag < 1e-9, np.nan, aspect)

    # laplacian of elevation -> convex ridge (+) vs concave hollow (-)
    d2y = np.gradient(dzdy, edge_order=1)[0] / dy
    d2x = np.gradient(dzdx, edge_order=1)[1] / dx
    curv = (d2x + d2y) * 100.0     # per 100 m, keeps the numbers readable

    return slope, aspect, curv


def aggregate(E, slope, aspect, curv, fine_lats, fine_lons, mask):
    """2x2 fine samples -> one 0.05 deg prediction cell.

    Coarse cells outside the sampled mask are all-NaN by design, so the nan*
    reductions below legitimately see empty slices. Those cells are marked
    invalid and dropped downstream; the warnings are noise, not a signal.
    """
    ny, nx = E.shape
    if ny % 2 or nx % 2:
        die("fine lattice %dx%d is not divisible into 2x2 blocks" % (ny, nx))
    cy, cx = ny // 2, nx // 2

    def blocks(A):
        return A.reshape(cy, 2, cx, 2).transpose(0, 2, 1, 3).reshape(cy, cx, 4)

    warnings.filterwarnings('ignore', r'(Mean|All-NaN|Degrees of freedom)',
                            category=RuntimeWarning)
    Eb, Sb, Cb, Ab = blocks(E), blocks(slope), blocks(curv), blocks(aspect)
    # a coarse cell is only real if at least one of its four fine samples was
    # actually fetched; the rest carry gradient artefacts from the mask edge
    valid = blocks(np.where(mask & np.isfinite(E), 1.0, np.nan))
    valid = np.isfinite(valid).any(axis=2)

    elev_mean = np.nanmean(Eb, axis=2)
    # max slope within the cell: what actually drives failure, and it survives
    # aggregation better than the mean
    slope_max = np.nanmax(Sb, axis=2)
    slope_mean = np.nanmean(Sb, axis=2)
    rough = np.nanstd(Eb, axis=2)
    curv_mean = np.nanmean(Cb, axis=2)

    # aspect is circular - average the unit vectors, not the degrees
    ar = np.radians(Ab)
    asin = np.nanmean(np.sin(ar), axis=2)
    acos = np.nanmean(np.cos(ar), axis=2)
    aspect_mean = (np.degrees(np.arctan2(asin, acos)) + 360.0) % 360.0

    # neighbourhood relief and topographic position over a 3x3 cell window
    pad = np.pad(elev_mean, 1, mode='edge')
    win = np.stack([pad[i:i + cy, j:j + cx] for i in range(3) for j in range(3)], axis=2)
    relief = np.nanmax(win, axis=2) - np.nanmin(win, axis=2)
    tpi = elev_mean - np.nanmean(win, axis=2)

    lat_c = fine_lats.reshape(cy, 2).mean(axis=1)
    lon_c = fine_lons.reshape(cx, 2).mean(axis=1)
    LATc, LONc = np.meshgrid(lat_c, lon_c, indexing='ij')

    slope_max = np.where(valid, slope_max, np.nan)
    slope_mean = np.where(valid, slope_mean, np.nan)
    elev_mean = np.where(valid, elev_mean, np.nan)

    print("fine slope : %.1f .. %.1f deg, median %.1f (sampled area only)"
          % (np.nanmin(slope[mask]), np.nanmax(slope[mask]), np.nanmedian(slope[mask])))
    print("valid cells: %s of %s coarse cells carry real samples"
          % (format(int(valid.sum()), ','), format(valid.size, ',')))

    df = pd.DataFrame({
        'lat': LATc.ravel(), 'lon': LONc.ravel(),
        'elevation_m': elev_mean.ravel(),
        'slope_deg': slope_max.ravel(),
        'slope_mean_deg': slope_mean.ravel(),
        'aspect_deg': aspect_mean.ravel(),
        'relief_m': relief.ravel(),
        'tpi_m': tpi.ravel(),
        'roughness_m': rough.ravel(),
        'curvature': curv_mean.ravel(),
    })
    print("coarse grid: %d x %d = %s cells @ %s deg" % (cy, cx, format(len(df), ','), COARSE))
    return df


# ------------------------------------------------- OSM admin point-in-polygon
def edge_soup(rel):
    """Outer+inner ways of a boundary relation, as line segments.

    Even-odd ray casting over the full edge soup is correct for a valid
    multipolygon without stitching ways into ordered rings: crossing an inner
    ring simply flips parity back to 'outside'.
    """
    segs = []
    for m in rel.get('members', []):
        if m.get('type') != 'way' or m.get('role') not in ('outer', 'inner'):
            continue
        g = m.get('geometry')
        if not g or len(g) < 2:
            continue
        pts = np.array([[p['lon'], p['lat']] for p in g if p], dtype='float64')
        if len(pts) >= 2:
            segs.append(pts)
    return segs


def build_polys(path, name_keys=('name:en', 'name')):
    if not os.path.exists(path):
        print("  WARNING: %s missing - attribute will be null" % os.path.basename(path))
        return []
    with open(path, encoding='utf-8') as fh:
        data = json.load(fh)
    out = []
    for rel in data.get('elements', []):
        segs = edge_soup(rel)
        if not segs:
            continue
        tags = rel.get('tags', {})
        nm = None
        for k in name_keys:
            if tags.get(k):
                nm = tags[k]
                break
        if not nm:
            continue
        x1 = np.concatenate([s[:-1, 0] for s in segs])
        y1 = np.concatenate([s[:-1, 1] for s in segs])
        x2 = np.concatenate([s[1:, 0] for s in segs])
        y2 = np.concatenate([s[1:, 1] for s in segs])
        out.append({'name': nm, 'x1': x1, 'y1': y1, 'x2': x2, 'y2': y2,
                    'bbox': (x1.min(), y1.min(), x1.max(), y1.max())})
    return out


def assign(polys, lon, lat, label):
    """Vectorised even-odd ray cast; returns an object array of polygon names."""
    res = np.full(lon.size, None, dtype=object)
    if not polys:
        return res
    unset = res == None  # noqa: E711 - elementwise on an object array
    for k, p in enumerate(polys, 1):
        x0, y0, x3, y3 = p['bbox']
        cand = np.where(unset & (lon >= x0) & (lon <= x3) &
                        (lat >= y0) & (lat <= y3))[0]
        if cand.size == 0:
            continue
        x1, y1, x2, y2 = p['x1'], p['y1'], p['x2'], p['y2']
        # points x edges is a dense 2-D intermediate; a big state against the
        # fine lattice would be tens of gigabytes, so walk it in chunks sized
        # to a fixed element budget rather than allocating it whole
        chunk = max(1, int(BROADCAST_BUDGET // max(x1.size, 1)))
        for lo in range(0, cand.size, chunk):
            sub = cand[lo:lo + chunk]
            px = lon[sub][:, None]
            py = lat[sub][:, None]
            straddle = (y1 > py) != (y2 > py)
            with np.errstate(divide='ignore', invalid='ignore'):
                xint = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
            inside = (straddle & (px < xint)).sum(axis=1) % 2 == 1
            hit = sub[inside]
            res[hit] = p['name']
            unset[hit] = False
        if k % 50 == 0 or k == len(polys):
            print("    %s: %d/%d polygons, %s assigned"
                  % (label, k, len(polys), format(int((~unset).sum()), ',')), flush=True)
    return res


def main():
    print('=' * 70)
    print('BUILDING PREDICTION GRID')
    print('=' * 70)
    E, fine_lats, fine_lons, mask = load_fine_dem()
    slope, aspect, curv = terrain_derivatives(E, fine_lats, fine_lons)
    df = aggregate(E, slope, aspect, curv, fine_lats, fine_lons, mask)

    n0 = len(df)
    df = df[(df.lat >= LAT_MIN) & (df.lat <= LAT_MAX) &
            (df.lon >= LON_MIN) & (df.lon <= LON_MAX)].reset_index(drop=True)
    print("clip to bbox lat %s-%s lon %s-%s: %s -> %s cells"
          % (LAT_MIN, LAT_MAX, LON_MIN, LON_MAX, format(n0, ','), format(len(df), ',')))

    print('\nassigning state / district from OSM boundaries...')
    lon = df.lon.to_numpy()
    lat = df.lat.to_numpy()
    states = build_polys(os.path.join(CACHE, 'osm_states.json'))
    dists = build_polys(os.path.join(CACHE, 'osm_districts.json'))
    print("  %d state polygons, %d district polygons" % (len(states), len(dists)))
    df['state'] = assign(states, lon, lat, 'state')
    df['district'] = assign(dists, lon, lat, 'district')
    ns = int(df.state.notna().sum())
    nd = int(df.district.notna().sum())
    print("  state assigned   : %s/%s (%.1f%%)" % (format(ns, ','), format(len(df), ','), 100 * ns / len(df)))
    print("  district assigned: %s/%s (%.1f%%)" % (format(nd, ','), format(len(df), ','), 100 * nd / len(df)))
    print("  cells with no Indian state (sea / Bhutan / Bangladesh / Myanmar / China): %s"
          % format(len(df) - ns, ','))

    df.insert(0, 'cell_id', ['%.3f_%.3f' % (a, b) for a, b in zip(df.lat, df.lon)])
    df.to_csv(OUT, index=False)
    print("\nwrote %s  (%.1f MB, %s rows)" % (OUT, os.path.getsize(OUT) / 1e6, format(len(df), ',')))
    print(df[['elevation_m', 'slope_deg', 'relief_m', 'tpi_m']].describe().T.to_string())


if __name__ == '__main__':
    main()
