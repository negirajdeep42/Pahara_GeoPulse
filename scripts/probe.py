import pandas as pd, numpy as np, re
t = pd.read_csv('SIH_CSV/NE_India_Terrain_Features.csv')
l = pd.read_csv('SIH_CSV/NE_landslides_raw_extracted.csv')
print('terrain rows', len(t), 'landslide rows', len(l))
shared = ['sl_no','slide_no','state','latitude','longitude','details','label','source']
print('same sl_no set   :', set(t.sl_no)==set(l.sl_no))
a = t[shared].sort_values('sl_no').reset_index(drop=True)
b = l[shared].sort_values('sl_no').reset_index(drop=True)
print('identical on shared cols:', a.equals(b))
print('label unique terrain:', t.label.unique(), ' landslide:', l.label.unique())
print('\nstate counts (terrain):'); print(t.state.value_counts())
print('\nunique coordinate pairs:', t[['latitude','longitude']].drop_duplicates().shape[0])
# coordinate spacing
lats = np.sort(t.latitude.unique()); lons = np.sort(t.longitude.unique())
print('median lat spacing', np.median(np.diff(lats)), 'median lon spacing', np.median(np.diff(lons)))
print('lat decimals sample', t.latitude.head(8).tolist())
# is it on a grid?
for step in [0.001,0.005,0.01,0.05,0.1]:
    r = np.abs(t.latitude/step - np.round(t.latitude/step)).max()
    print(f'  grid-aligned at {step}? max resid {r:.4f}')
print('\n--- details column samples ---')
for s in t.details.dropna().sample(12, random_state=0):
    print(repr(s[:120]))
# date extraction from details
pat = re.compile(r'(\d{1,2}\s*[-/. ]?\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*[-/. ]?\s*(?:19|20)\d{2})', re.I)
found = t.details.fillna('').apply(lambda s: bool(pat.search(s)))
print('\ndetails containing a dd Mon yyyy date:', found.sum(), '/', len(t))
yr = t.details.fillna('').str.extract(r'((?:19|20)\d{2})')[0]
print('details containing a 4-digit year:', yr.notna().sum())
print('year value counts:'); print(yr.value_counts().sort_index().to_string())
# slide_no embedded year
sy = t.slide_no.fillna('').str.extract(r'/((?:19|20)\d{2})/')[0]
print('\nslide_no embedded year count:', sy.notna().sum())
print(sy.value_counts().sort_index().to_string())
