"""Writers for the three deliverables in ./out/.

  risk_grid_ne.geojson  one square Polygon per modelled cell, plus a top-level
                        "metadata" object
  places.json           one record per settlement, carrying the MAX susceptibility
                        of the cells around it
  metrics.json          the metadata block on its own, for slides
"""
import os, json
import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

SEP = (',', ':')          # compact separators
COORD_DP = 4
SIZE_WARN_MB = 8.0
CLASS_NAMES = ['Very Low', 'Low', 'Moderate', 'High', 'Very High']


# how many decimals each property is worth keeping; metres do not need 4 dp
ROUND_DP = {'elevation_m': 1, 'relief_m': 1, 'tpi_m': 1, 'roughness_m': 1,
            'dist_village_km': 2,
            'slope_deg': 2, 'slope_mean_deg': 2, 'aspect_deg': 1,
            'curvature': 3, 'aspect_sin': 3, 'aspect_cos': 3}


def _clean(v, dp=4):
    """JSON-safe scalar: numpy -> python, NaN -> None."""
    if v is None:
        return None
    if isinstance(v, (np.floating, float)):
        return None if not np.isfinite(v) else round(float(v), dp)
    if isinstance(v, (np.integer, int)):
        return int(v)
    if isinstance(v, (np.bool_, bool)):
        return bool(v)
    if isinstance(v, float) and np.isnan(v):
        return None
    s = str(v)
    return None if s in ('nan', 'None', 'NaT', '') else s


def _report_size(path, label):
    mb = os.path.getsize(path) / 1e6
    print("  wrote %-28s %8.2f MB" % (label, mb))
    if mb > SIZE_WARN_MB:
        print("  " + "!" * 66)
        print("  !! WARNING: %s is %.2f MB, over the %.0f MB limit you set." % (label, mb, SIZE_WARN_MB))
        print("  !! Options: raise cell_size_deg, drop the per-cell model features,")
        print("  !! or serve it gzipped (this file compresses to roughly a fifth).")
        print("  " + "!" * 66)
    return mb


def write_geojson(grid, feats, meta, out_dir):
    """FeatureCollection of square cell polygons, with metadata at the top level."""
    print("\nwriting risk_grid_ne.geojson ...")
    half = meta['cell_size_deg'] / 2.0

    # optional descriptive columns, included only where they actually exist
    extra = [c for c in ['slope_deg', 'state', 'district', 'nearest_village',
                         'population', 'dist_village_km']
             if c in grid.columns]
    prop_cols = list(dict.fromkeys(extra + list(feats)))
    print("  properties per cell: cell_id, lat, lon, susceptibility, suscept_class, "
          + ', '.join(prop_cols))

    lat = grid.lat.to_numpy(float)
    lon = grid.lon.to_numpy(float)
    cid = grid.cell_id.to_numpy()
    sus = grid.susceptibility.to_numpy(float)
    cls = grid.suscept_class.to_numpy()
    cols = {c: grid[c].to_numpy() for c in prop_cols}

    feats_out = []
    for k in range(len(grid)):
        a, b = lat[k], lon[k]
        w, e = round(b - half, COORD_DP), round(b + half, COORD_DP)
        s, n = round(a - half, COORD_DP), round(a + half, COORD_DP)
        props = {
            'cell_id': str(cid[k]),
            'lat': round(a, COORD_DP),
            'lon': round(b, COORD_DP),
            'susceptibility': round(float(sus[k]), 4),
            'suscept_class': str(cls[k]),
        }
        for c in prop_cols:
            props[c] = _clean(cols[c][k], ROUND_DP.get(c, 4))
        feats_out.append({
            'type': 'Feature',
            'geometry': {'type': 'Polygon',
                         'coordinates': [[[w, s], [e, s], [e, n], [w, n], [w, s]]]},
            'properties': props,
        })

    fc = {'type': 'FeatureCollection', 'metadata': meta, 'features': feats_out}
    path = os.path.join(out_dir, 'risk_grid_ne.geojson')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(fc, fh, separators=SEP, ensure_ascii=False)
    print("  %s cell polygons" % format(len(feats_out), ','))
    _report_size(path, 'risk_grid_ne.geojson')
    return path


def _load_settlements(cache_dir):
    """OSM place nodes cached by fetch_osm.py."""
    rows = []
    for fn in sorted(os.listdir(cache_dir)):
        if not fn.startswith('osm_places_band'):
            continue
        with open(os.path.join(cache_dir, fn), encoding='utf-8') as fh:
            for el in json.load(fh).get('elements', []):
                t = el.get('tags', {})
                name = t.get('name:en') or t.get('name')
                if not name or 'lat' not in el:
                    continue
                pop = t.get('population')
                try:
                    pop = int(str(pop).replace(',', '').strip()) if pop else None
                except ValueError:
                    pop = None
                rows.append({'name': name, 'lat': float(el['lat']), 'lon': float(el['lon']),
                             'place': t.get('place'), 'population': pop})
    df = pd.DataFrame(rows)
    if len(df):
        df = df.drop_duplicates(subset=['name', 'lat', 'lon']).reset_index(drop=True)
    return df


def attach_nearest_settlement(grid, cache_dir, earth_r_km):
    """Add nearest_village / population / dist_village_km to each grid cell."""
    st = _load_settlements(cache_dir)
    if not len(st):
        print("  WARNING: no cached settlements - nearest_village will be omitted")
        return
    tree = BallTree(np.radians(np.column_stack([st.lat.to_numpy(float),
                                                st.lon.to_numpy(float)])), metric='haversine')
    q = np.radians(np.column_stack([grid.lat.to_numpy(float), grid.lon.to_numpy(float)]))
    d, i = tree.query(q, k=1)
    grid['nearest_village'] = st.name.to_numpy()[i[:, 0]]
    grid['population'] = st.population.to_numpy()[i[:, 0]]
    grid['dist_village_km'] = d[:, 0] * earth_r_km
    print("  nearest settlement attached to %s cells (median %.1f km away)"
          % (format(len(grid), ','), float(np.median(grid.dist_village_km))))


def write_places(grid, out_dir, cache_dir, radius_km, earth_r_km):
    """One record per settlement, carrying the MAX susceptibility of nearby cells.

    Max, not mean: if any cell near a settlement is high risk, the settlement
    should surface as high risk.
    """
    print("\nwriting places.json ...")
    st = _load_settlements(cache_dir)
    if not len(st):
        print("  WARNING: no cached OSM settlements found - writing an empty places.json")
        path = os.path.join(out_dir, 'places.json')
        with open(path, 'w', encoding='utf-8') as fh:
            json.dump({'places': [], 'count': 0,
                       'note': 'no settlement source available'}, fh, separators=SEP)
        return path
    print("  settlements from OSM       : %s" % format(len(st), ','))

    # state / district by point-in-polygon, same routine the grid used
    import build_grid as bg
    states = bg.build_polys(os.path.join(cache_dir, 'osm_states.json'))
    dists = bg.build_polys(os.path.join(cache_dir, 'osm_districts.json'))
    slon, slat = st.lon.to_numpy(), st.lat.to_numpy()
    st['state'] = bg.assign(states, slon, slat, 'place-state')
    st['district'] = bg.assign(dists, slon, slat, 'place-district')

    n_before = len(st)
    st = st[st.state.notna()].reset_index(drop=True)
    print("  inside an Indian state     : %s  (dropped %s across the border)"
          % (format(len(st), ','), format(n_before - len(st), ',')))

    # MAX susceptibility over cells within radius_km
    grid_rad = np.radians(np.column_stack([grid.lat.to_numpy(float), grid.lon.to_numpy(float)]))
    tree = BallTree(grid_rad, metric='haversine')
    q = np.radians(np.column_stack([st.lat.to_numpy(float), st.lon.to_numpy(float)]))
    idx = tree.query_radius(q, r=radius_km / earth_r_km)

    sus = grid.susceptibility.to_numpy(float)
    cls = grid.suscept_class.to_numpy()
    order = {c: i for i, c in enumerate(CLASS_NAMES)}

    recs = []
    n_nocell = 0
    for k in range(len(st)):
        ii = idx[k]
        if ii.size:
            j = ii[int(np.argmax(sus[ii]))]
            smax = float(sus[j])
            # classes are quantiles of the score, so the worst class is the one
            # the highest-scoring cell falls in
            worst = str(cls[j])
        else:
            n_nocell += 1
            smax, worst = None, None
        r = st.iloc[k]
        recs.append({
            'name': r['name'],
            'lat': round(float(r['lat']), 4),
            'lon': round(float(r['lon']), 4),
            'state': _clean(r['state']),
            'district': _clean(r['district']),
            'population': _clean(r['population']),
            'place_type': _clean(r['place']),
            'susceptibility': round(smax, 4) if smax is not None else None,
            'suscept_class': worst,
            'cells_within_km': radius_km,
            'n_cells': int(ii.size),
        })

    recs.sort(key=lambda r: (r['susceptibility'] is None, -(r['susceptibility'] or 0)))
    path = os.path.join(out_dir, 'places.json')
    payload = {
        'count': len(recs),
        'note': ('susceptibility is the MAXIMUM over modelled cells within %.0f km, '
                 'not the mean' % radius_km),
        'population_note': ('population is the OSM tag where present; null means untagged, '
                            'not zero. The supplied CSVs carry no population field.'),
        'places': recs,
    }
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(payload, fh, separators=SEP, ensure_ascii=False)
    n_pop = sum(1 for r in recs if r['population'] is not None)
    print("  settlements written        : %s" % format(len(recs), ','))
    print("  with an OSM population tag : %s (%.1f%%)" % (format(n_pop, ','), 100 * n_pop / len(recs)))
    print("  with no modelled cell <= %.0f km: %s (flat surroundings)"
          % (radius_km, format(n_nocell, ',')))
    _report_size(path, 'places.json')
    return path


def write_metrics(meta, out_dir):
    print("\nwriting metrics.json ...")
    path = os.path.join(out_dir, 'metrics.json')
    with open(path, 'w', encoding='utf-8') as fh:
        json.dump(meta, fh, indent=2, ensure_ascii=False)
    _report_size(path, 'metrics.json')
    return path
