"""Landslide susceptibility model for Northeast India.

Trains on a real 0.05 deg terrain grid (built by build_grid.py from an Open-Meteo
DEM) against the GSI landslide inventory, and writes the three deliverables to ./out/.

The two things that make or break this kind of model, and how they are handled:

  Negative sampling. Negatives are drawn to match the positives' slope-decile
  distribution. Sampling negatives uniformly would load the negative class with
  flat Brahmaputra valley floor, and the model would learn nothing beyond
  "steep is dangerous" - which needs no ML and scores a flattering AUC.

  Validation. Neighbouring cells are not independent, so a random split leaks
  training information into the test fold. The headline number is therefore
  GroupKFold over 0.5 deg spatial blocks; the random StratifiedKFold AUC is
  reported alongside it purely to show the size of that inflation.
"""
import os, sys, json, re, time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree
from sklearn.model_selection import GroupKFold, StratifiedKFold
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import roc_auc_score

# ------------------------------------------------------------------ config
LAT_MIN, LAT_MAX = 21.5, 29.6
LON_MIN, LON_MAX = 87.8, 97.5
CELL_DEG = 0.05
MIN_SLOPE_DEG = 3.0
POS_RADIUS_KM = 2.0
BLOCK_DEG = 0.5
N_FOLDS = 5
NEG_RATIO = 1.0          # negatives drawn per positive
# The bbox is a rectangle, so it also covers Bhutan, Bangladesh, Myanmar, China and
# parts of WB/Bihar/Jharkhand. The GSI inventory surveys none of those, so cells there
# would enter the negative class as false negatives - teaching the model that
# unsurveyed steep terrain is safe. Model only the states the inventory covers.
RESTRICT_TO_INVENTORY_STATES = True
SETTLEMENT_RADIUS_KM = 5.0
EARTH_R_KM = 6371.0088
RANDOM_STATE = 42
SIZE_WARN_MB = 8.0

CLASS_NAMES = ['Very Low', 'Low', 'Moderate', 'High', 'Very High']
HIGH_CLASSES = ['High', 'Very High']
ENCODINGS = ['utf-8', 'latin-1', 'cp1252']

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(ROOT, 'SIH_CSV')
CACHE = os.environ.get('SIH_CACHE_DIR') or os.path.join(ROOT, 'data', 'cache')
OUT_DIR = os.environ.get('SIH_OUT_DIR') or os.path.join(ROOT, 'out')
GRID_CSV = os.path.join(CACHE, 'grid_ne_005.csv')
DEM_NPZ = os.path.join(CACHE, 'dem_fine_0025.npz')
INVENTORY = os.path.join(CSV_DIR, 'NE_landslides_raw_extracted.csv')


def die(msg):
    print("\n" + "=" * 70, file=sys.stderr)
    print("FAILED: " + msg, file=sys.stderr)
    print("=" * 70, file=sys.stderr)
    sys.exit(1)


def step(n, msg):
    print("\n[%s] %s" % (n, msg), flush=True)


def read_csv_robust(path, what):
    """Read a CSV trying utf-8 then the common Windows fallbacks."""
    if not os.path.exists(path):
        die("%s not found at %s" % (what, path))
    last = None
    for enc in ENCODINGS:
        try:
            return pd.read_csv(path, encoding=enc, low_memory=False)
        except UnicodeDecodeError as e:
            last = e
        except Exception as e:
            die("could not parse %s (%s): %s" % (what, path, e))
    die("could not decode %s with any of %s: %s" % (what, ENCODINGS, last))


def require(df, cols, what):
    missing = [c for c in cols if c not in df.columns]
    if missing:
        die("%s is missing required column(s): %s\n        columns present: %s"
            % (what, ', '.join(missing), ', '.join(map(str, df.columns))))


def find_col(df, candidates, what, required=True):
    lower = {str(c).strip().lower(): c for c in df.columns}
    for cand in candidates:
        if cand in lower:
            return lower[cand]
    if required:
        die("%s: could not find a column among %s\n        columns present: %s"
            % (what, candidates, ', '.join(map(str, df.columns))))
    return None


# ----------------------------------------------------------- inventory dates
MONTHS = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'
RE_FULL = re.compile(r'(\d{1,2}\s+(?:%s)[a-z]*\.?\s+(?:19|20)\d{2})' % MONTHS, re.I)
RE_YEAR = re.compile(r'((?:19|20)\d{2})')
RE_SLIDE_YEAR = re.compile(r'/((?:19|20)\d{2})/')


def inventory_dates(inv):
    """Dates live in free text, not a date column. Pull what is actually there."""
    details = inv['details'].fillna('') if 'details' in inv.columns else pd.Series([''] * len(inv))
    full = details.str.extract(RE_FULL)[0]
    parsed = pd.to_datetime(full, errors='coerce', format='mixed', dayfirst=True)
    year = pd.to_numeric(details.str.extract(RE_YEAR)[0], errors='coerce')
    if 'slide_no' in inv.columns:
        sy = pd.to_numeric(inv['slide_no'].fillna('').str.extract(RE_SLIDE_YEAR)[0], errors='coerce')
        year = year.fillna(sy)
    return parsed, year


# ------------------------------------------------------------------- helpers
def dem_source():
    """Which elevation provider actually produced the grid."""
    try:
        z = np.load(DEM_NPZ)
        if 'source' in z.files:
            return str(z['source'])
    except Exception:
        pass
    return 'elevation API (provider not recorded in the DEM cache)'


def to_rad(lat, lon):
    return np.radians(np.column_stack([np.asarray(lat, float), np.asarray(lon, float)]))


def circular_stats(deg):
    r = np.radians(pd.to_numeric(deg, errors='coerce').to_numpy(float))
    return np.sin(r), np.cos(r)


def main():
    t_start = time.time()
    os.makedirs(OUT_DIR, exist_ok=True)
    print("=" * 70)
    print("NE INDIA LANDSLIDE SUSCEPTIBILITY")
    print("=" * 70)

    # ------------------------------------------------------------ 1. grid
    step('1/9', 'loading prediction grid')
    if not os.path.exists(GRID_CSV):
        die("prediction grid not found at %s.\n"
            "        Run: python scripts/fetch_dem.py && python scripts/build_grid.py" % GRID_CSV)
    grid = read_csv_robust(GRID_CSV, 'prediction grid')
    require(grid, ['cell_id', 'lat', 'lon', 'slope_deg', 'aspect_deg'], 'prediction grid')
    print("  grid cells loaded          : %s" % format(len(grid), ','))

    n0 = len(grid)
    grid = grid[(grid.lat >= LAT_MIN) & (grid.lat <= LAT_MAX) &
                (grid.lon >= LON_MIN) & (grid.lon <= LON_MAX)]
    print("  after bbox clip            : %s  (dropped %s)"
          % (format(len(grid), ','), format(n0 - len(grid), ',')))

    if RESTRICT_TO_INVENTORY_STATES:
        inv_peek = read_csv_robust(INVENTORY, 'landslide inventory')
        st_col = find_col(inv_peek, ['state'], 'landslide inventory', required=False)
        if st_col and 'state' in grid.columns:
            keep = {str(v).strip().lower() for v in inv_peek[st_col].dropna().unique()}
            n_pre = len(grid)
            gs = grid.state.astype(str).str.strip().str.lower()
            grid = grid[gs.isin(keep)]
            print("  after restricting to the %d states the" % len(keep))
            print("  inventory covers            : %s  (dropped %s cells with no survey coverage)"
                  % (format(len(grid), ','), format(n_pre - len(grid), ',')))
            print("    kept: %s" % ', '.join(sorted(inv_peek[st_col].dropna().unique())))
        else:
            print("  WARNING: no state column to restrict on - modelling the whole bbox")

    n1 = len(grid)
    grid = grid[grid.slope_deg.notna() & (grid.slope_deg >= MIN_SLOPE_DEG)].reset_index(drop=True)
    print("  after slope >= %.0f deg filter: %s  (dropped %s flat/valley cells)"
          % (MIN_SLOPE_DEG, format(len(grid), ','), format(n1 - len(grid), ',')))
    if len(grid) < 500:
        die("only %d cells survive the slope filter - grid is too small to model" % len(grid))

    # ---------------------------------------------------------- 2. labels
    step('2/9', 'labelling cells from the landslide inventory (BallTree, haversine)')
    inv = read_csv_robust(INVENTORY, 'landslide inventory')
    lat_c = find_col(inv, ['latitude', 'lat', 'y'], 'landslide inventory')
    lon_c = find_col(inv, ['longitude', 'lon', 'lng', 'long', 'x'], 'landslide inventory')
    inv = inv[inv[lat_c].notna() & inv[lon_c].notna()].copy()
    n_inv_all = len(inv)
    inv = inv[(inv[lat_c] >= LAT_MIN) & (inv[lat_c] <= LAT_MAX) &
              (inv[lon_c] >= LON_MIN) & (inv[lon_c] <= LON_MAX)].reset_index(drop=True)
    print("  inventory records          : %s (%s inside bbox)"
          % (format(n_inv_all, ','), format(len(inv), ',')))
    if len(inv) == 0:
        die("no landslide records fall inside the study bbox")

    tree = BallTree(to_rad(inv[lat_c], inv[lon_c]), metric='haversine')
    grid_rad = to_rad(grid.lat, grid.lon)
    n_within = tree.query_radius(grid_rad, r=POS_RADIUS_KM / EARTH_R_KM, count_only=True)
    grid['n_slides_2km'] = n_within
    grid['label'] = (n_within > 0).astype(int)
    n_pos = int(grid.label.sum())
    print("  cells with a slide <= %.0f km : %s  (%.2f%% of modelled cells)"
          % (POS_RADIUS_KM, format(n_pos, ','), 100 * n_pos / len(grid)))
    if n_pos < 100:
        die("only %d positive cells - not enough signal to train on" % n_pos)

    # ------------------------------------------------- 3. negative sampling
    step('3/9', 'slope-decile-matched negative sampling')
    pos = grid[grid.label == 1]
    cand = grid[grid.label == 0]
    print("  positive cells             : %s" % format(len(pos), ','))
    print("  candidate negative cells   : %s" % format(len(cand), ','))

    # decile edges from the POSITIVES' slope distribution
    edges = np.unique(np.quantile(pos.slope_deg, np.linspace(0, 1, 11)))
    edges[0], edges[-1] = -np.inf, np.inf
    pos_bin = pd.cut(pos.slope_deg, edges, labels=False, include_lowest=True)
    cand_bin = pd.cut(cand.slope_deg, edges, labels=False, include_lowest=True)

    rng = np.random.default_rng(RANDOM_STATE)
    target_total = int(round(len(pos) * NEG_RATIO))
    picks, shortfall = [], 0
    print("  %-5s %-16s %8s %10s %8s" % ('bin', 'slope range (deg)', 'pos', 'available', 'drawn'))
    for b in range(len(edges) - 1):
        n_want = int(round(target_total * (pos_bin == b).sum() / len(pos)))
        pool = cand.index[cand_bin == b].to_numpy()
        n_take = min(n_want, pool.size)
        if n_take:
            picks.append(rng.choice(pool, size=n_take, replace=False))
        shortfall += n_want - n_take
        lo = edges[b] if np.isfinite(edges[b]) else pos.slope_deg.min()
        hi = edges[b + 1] if np.isfinite(edges[b + 1]) else pos.slope_deg.max()
        print("  %-5d %6.1f - %-7.1f %8d %10d %8d"
              % (b, lo, hi, int((pos_bin == b).sum()), pool.size, n_take))
    neg_idx = np.concatenate(picks) if picks else np.array([], dtype=int)
    if shortfall:
        print("  NOTE: %s negatives short - some slope bins hold fewer non-slide cells "
              "than the matched quota" % format(shortfall, ','))

    train = pd.concat([pos, grid.loc[neg_idx]]).reset_index(drop=True)
    print("  training set               : %s rows (%s pos / %s neg)"
          % (format(len(train), ','), format(int(train.label.sum()), ','),
             format(int((train.label == 0).sum()), ',')))
    # show that the matching actually worked
    print("  mean slope  positives %.1f deg  vs  negatives %.1f deg  "
          "(uniform sampling would have given ~%.1f)"
          % (pos.slope_deg.mean(), grid.loc[neg_idx].slope_deg.mean(), cand.slope_deg.mean()))

    # -------------------------------------------------------- 4. features
    step('4/9', 'assembling features')
    drop = {'label', 'lat', 'lon', 'n_slides_2km', 'aspect_deg', 'block_id',
            'susceptibility', 'sl_no', 'slide_no', 'index', 'id', 'cell_id',
            # descriptive, attached after training - never predictors
            'population', 'dist_village_km'}
    feats = [c for c in grid.columns
             if c not in drop and pd.api.types.is_numeric_dtype(grid[c])]
    for df in (grid, train):
        s, c = circular_stats(df['aspect_deg'])
        df['aspect_sin'] = s
        df['aspect_cos'] = c
    feats = feats + ['aspect_sin', 'aspect_cos']
    print("  %d features: %s" % (len(feats), ', '.join(feats)))
    print("  aspect encoded as sin/cos so 359 deg and 1 deg sit next to each other")

    X = train[feats].to_numpy(float)
    y = train['label'].to_numpy(int)
    groups = (np.floor(train.lat / BLOCK_DEG).astype(int) * 1000 +
              np.floor(train.lon / BLOCK_DEG).astype(int))
    train['block_id'] = groups
    print("  spatial blocks (%.1f deg)   : %d distinct" % (BLOCK_DEG, len(np.unique(groups))))

    # ----------------------------------------------------------- 5. model
    step('5/9', 'model selection')
    try:
        from xgboost import XGBClassifier
        import xgboost
        def make_model():
            return XGBClassifier(
                n_estimators=400, max_depth=5, learning_rate=0.05,
                subsample=0.8, colsample_bytree=0.8,
                reg_lambda=1.0, min_child_weight=5,
                eval_metric='logloss', tree_method='hist',
                random_state=RANDOM_STATE, n_jobs=-1)
        model_name = 'XGBClassifier (xgboost %s)' % xgboost.__version__
    except ImportError:
        from sklearn.ensemble import RandomForestClassifier
        def make_model():
            return RandomForestClassifier(
                n_estimators=500, max_depth=None, min_samples_leaf=5,
                n_jobs=-1, random_state=RANDOM_STATE)
        model_name = 'RandomForestClassifier (xgboost unavailable)'
    print("  " + model_name)

    def logreg():
        return Pipeline([('impute', SimpleImputer(strategy='median')),
                         ('scale', StandardScaler()),
                         ('clf', LogisticRegression(max_iter=2000, random_state=RANDOM_STATE))])

    def cv_auc(make, splits, label):
        aucs = []
        for k, (tr, te) in enumerate(splits, 1):
            if len(np.unique(y[te])) < 2:
                print("    fold %d skipped - single class in test fold" % k)
                continue
            m = make()
            m.fit(X[tr], y[tr])
            a = roc_auc_score(y[te], m.predict_proba(X[te])[:, 1])
            aucs.append(a)
            print("    fold %d  n_test=%-6s AUC=%.4f" % (k, format(len(te), ','), a))
        if not aucs:
            die("%s: every fold was degenerate" % label)
        return float(np.mean(aucs)), float(np.std(aucs)), aucs

    # ------------------------------------------------------ 6. validation
    step('6/9', 'validation')
    gkf = list(GroupKFold(n_splits=N_FOLDS).split(X, y, groups))
    skf = list(StratifiedKFold(n_splits=N_FOLDS, shuffle=True,
                               random_state=RANDOM_STATE).split(X, y))

    print("\n  --- SPATIAL CV: GroupKFold over %.1f deg blocks (the honest number) ---" % BLOCK_DEG)
    auc_spatial, sd_spatial, _ = cv_auc(make_model, gkf, 'spatial CV')
    print("  spatial CV AUC            = %.4f  (+/- %.4f)" % (auc_spatial, sd_spatial))

    print("\n  --- RANDOM CV: StratifiedKFold (inflated, shown for contrast) ---")
    auc_random, sd_random, _ = cv_auc(make_model, skf, 'random CV')
    print("  random CV AUC             = %.4f  (+/- %.4f)" % (auc_random, sd_random))

    print("\n  --- BASELINE: logistic regression under the SAME spatial CV ---")
    auc_logreg, sd_logreg, _ = cv_auc(logreg, gkf, 'logreg baseline')
    print("  logreg spatial CV AUC     = %.4f  (+/- %.4f)" % (auc_logreg, sd_logreg))

    print("\n  " + "-" * 60)
    print("  HONEST (spatial blocks)  AUC = %.4f" % auc_spatial)
    print("  INFLATED (random split)  AUC = %.4f" % auc_random)
    print("  inflation from spatial autocorrelation = %+.4f" % (auc_random - auc_spatial))
    print("  logistic baseline, spatial   = %.4f  -> %s adds %+.4f"
          % (auc_logreg, model_name.split()[0], auc_spatial - auc_logreg))
    print("  " + "-" * 60)

    # ------------------------------------------------- 7. fit and predict
    step('7/9', 'fitting final model and scoring the full grid')
    final = make_model()
    final.fit(X, y)
    Xg = grid[feats].to_numpy(float)
    grid['susceptibility'] = final.predict_proba(Xg)[:, 1]

    if hasattr(final, 'feature_importances_'):
        imp = dict(zip(feats, [float(v) for v in final.feature_importances_]))
    else:
        imp = {}
    imp = dict(sorted(imp.items(), key=lambda kv: -kv[1]))
    print("  feature importance:")
    for k, v in imp.items():
        print("    %-16s %.4f  %s" % (k, v, '#' * int(round(v * 60))))

    # quantile classes over the modelled grid
    grid['suscept_class'] = pd.qcut(grid.susceptibility.rank(method='first'),
                                    5, labels=CLASS_NAMES).astype(str)
    print("\n  class distribution (quantile bins):")
    cls_counts = grid.suscept_class.value_counts().reindex(CLASS_NAMES)
    for c in CLASS_NAMES:
        lo = grid.loc[grid.suscept_class == c, 'susceptibility'].min()
        hi = grid.loc[grid.suscept_class == c, 'susceptibility'].max()
        print("    %-10s %6s cells   p = %.4f .. %.4f" % (c, format(int(cls_counts[c]), ','), lo, hi))

    # nearest settlement per cell - the frontend contract expects these, and the
    # OSM place nodes fetched for places.json already carry them
    from export import attach_nearest_settlement
    attach_nearest_settlement(grid, CACHE, EARTH_R_KM)

    # -------------------------------------------- 8. capture rate vs area
    step('8/9', 'capture rate: landslides caught vs area flagged')
    cell_tree = BallTree(grid_rad, metric='haversine')
    half_diag_km = (CELL_DEG / 2) * 111.32 * np.sqrt(2)
    d, i = cell_tree.query(to_rad(inv[lat_c], inv[lon_c]), k=1)
    d_km = d[:, 0] * EARTH_R_KM
    matched = d_km <= half_diag_km
    cls_of_slide = pd.Series(grid.suscept_class.to_numpy()[i[:, 0]])[matched]
    n_matched = int(matched.sum())

    in_high = int(cls_of_slide.isin(HIGH_CLASSES).sum())
    pct_slides = 100 * in_high / n_matched if n_matched else 0.0
    # true area needs the cos(lat) shrink of a degree of longitude
    w = np.cos(np.radians(grid.lat.to_numpy()))
    area_high = float(w[grid.suscept_class.isin(HIGH_CLASSES).to_numpy()].sum())
    pct_area = 100 * area_high / float(w.sum())

    print("  inventory records inside bbox        : %s" % format(len(inv), ','))
    print("  matched to a modelled cell           : %s (%.1f%%)"
          % (format(n_matched, ','), 100 * n_matched / len(inv)))
    print("  unmatched (flat cells dropped, or    : %s"
          % format(len(inv) - n_matched, ','))
    print("   outside the modelled surface)")
    print("")
    print("  >> %.1f%% of matched landslides fall in High + Very High" % pct_slides)
    print("  >> those classes cover %.1f%% of the modelled area" % pct_area)
    if pct_area > 0:
        print("  >> capture ratio = %.2fx better than flagging land at random"
              % (pct_slides / pct_area))
    for c in CLASS_NAMES:
        n = int((cls_of_slide == c).sum())
        a = 100 * float(w[(grid.suscept_class == c).to_numpy()].sum()) / float(w.sum())
        print("     %-10s %6s slides (%5.1f%%)   %5.1f%% of area"
              % (c, format(n, ','), 100 * n / n_matched if n_matched else 0, a))

    # ------------------------------------------------------- 9. metadata
    step('9/9', 'assembling metadata')
    parsed, year = inventory_dates(inv)
    if parsed.notna().any():
        date_range = "%s .. %s (%d of %d records carry a day-precision date; %d carry a year)" % (
            parsed.min().date(), parsed.max().date(), int(parsed.notna().sum()),
            len(inv), int(year.notna().sum()))
    else:
        date_range = "no parseable dates in the inventory"

    meta = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'method': ('%s on slope-decile-matched negatives; validated with GroupKFold '
                   'over %.1f deg spatial blocks' % (model_name, BLOCK_DEG)),
        'dem_source': dem_source(),
        'auc_spatial_cv': round(auc_spatial, 4),
        'auc_random_cv': round(auc_random, 4),
        'auc_logreg_baseline': round(auc_logreg, 4),
        'auc_note': ('auc_spatial_cv is the honest figure. auc_random_cv is inflated by '
                     'spatial autocorrelation between neighbouring cells and is reported '
                     'only to show the size of that inflation.'),
        'auc_spatial_cv_std': round(sd_spatial, 4),
        'auc_random_cv_std': round(sd_random, 4),
        'auc_logreg_baseline_std': round(sd_logreg, 4),
        'cell_count': int(len(grid)),
        'cell_size_deg': CELL_DEG,
        'training_samples': int(len(train)),
        'positive_samples': int(train.label.sum()),
        'negative_samples': int((train.label == 0).sum()),
        'landslide_records': int(len(inv)),
        'landslide_records_matched_to_cell': n_matched,
        'landslide_date_range': date_range,
        'feature_importance': {k: round(v, 4) for k, v in imp.items()},
        'features': feats,
        'class_distribution': {c: int(cls_counts[c]) for c in CLASS_NAMES},
        'pct_landslides_in_high_and_very_high': round(pct_slides, 1),
        'pct_area_in_high_and_very_high': round(pct_area, 1),
        'capture_ratio': round(pct_slides / pct_area, 2) if pct_area else None,
        'restricted_to_inventory_states': bool(RESTRICT_TO_INVENTORY_STATES),
        'positive_radius_km': POS_RADIUS_KM,
        'min_slope_deg': MIN_SLOPE_DEG,
        'spatial_block_deg': BLOCK_DEG,
        'bbox': {'lat_min': LAT_MIN, 'lat_max': LAT_MAX,
                 'lon_min': LON_MIN, 'lon_max': LON_MAX},
        'data_sources': [
            'NE_landslides_raw_extracted.csv - GSI landslide inventory (labels)',
            '%s - elevation sampled at 0.025 deg; slope, aspect, relief, TPI, '
            'roughness and curvature derived from it' % dem_source(),
            'OpenStreetMap via Overpass - state and district boundaries, settlements and '
            'population tags',
            'NE_India_Terrain_Features.csv - point terrain at inventory locations '
            '(cross-check only; it is the inventory itself, not a grid)',
        ],
        'caveats': [
            'NE_India_Terrain_Features.csv is the landslide inventory with terrain columns '
            'appended, not a prediction grid: all 9788 rows are label=1. The prediction '
            'surface here was therefore built from a DEM fetched for the study area.',
            'Susceptibility is static terrain-based likelihood. It is not a forecast and '
            'carries no timing.',
            'Slope is scale-dependent. Grid slope here is derived on a ~2.8 km baseline '
            '(0.025 deg DEM sampling) and so reads lower than the slope_degrees column in '
            'NE_India_Terrain_Features.csv, which came from a fine DEM at point locations. '
            'The two are not directly comparable; the min_slope_deg threshold and the '
            'slope deciles both refer to the grid-scale value.',
            'Inventory coverage is uneven between states, so absolute probabilities are '
            'better read as a ranking than as true frequencies.',
            'The modelled surface is clipped to the eight states the GSI inventory covers. '
            'The requested bbox also spans Bhutan, Bangladesh, Myanmar, China and parts of '
            'West Bengal/Bihar/Jharkhand; those cells were excluded because no survey '
            'covers them, so their absence of records is not evidence of stability.',
        ],
    }

    write_outputs(grid, feats, meta, inv, lat_c, lon_c)
    print("\nfinished in %.1f s" % (time.time() - t_start))


# --------------------------------------------------------------- exporting
def write_outputs(grid, feats, meta, inv, lat_c, lon_c):
    from export import write_geojson, write_places, write_metrics
    write_geojson(grid, feats, meta, OUT_DIR)
    write_places(grid, OUT_DIR, CACHE, SETTLEMENT_RADIUS_KM, EARTH_R_KM)
    write_metrics(meta, OUT_DIR)


if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
