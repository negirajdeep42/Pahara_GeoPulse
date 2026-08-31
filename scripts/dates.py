import pandas as pd, numpy as np, re, glob, os
l = pd.read_csv('SIH_CSV/NE_landslides_raw_extracted.csv')
det = l.details.fillna('')

# full dd Month yyyy
full = det.str.extract(r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2})', flags=re.I)[0]
fd = pd.to_datetime(full, errors='coerce', format='mixed', dayfirst=True)
# Month yyyy only
mon = det.str.extract(r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(?:19|20)\d{2})', flags=re.I)[0]
md = pd.to_datetime(mon, errors='coerce', format='mixed')
yr  = pd.to_numeric(det.str.extract(r'((?:19|20)\d{2})')[0], errors='coerce')
syr = pd.to_numeric(l.slide_no.fillna('').str.extract(r'/((?:19|20)\d{2})/')[0], errors='coerce')

N=len(l)
print(f'landslide records                 : {N:,}')
print(f'full day-precision date in details: {fd.notna().sum():,}  ({100*fd.notna().sum()/N:.1f}%)')
print(f'  range                           : {fd.min().date()} .. {fd.max().date()}')
print(f'month-precision date in details   : {md.notna().sum():,}  ({100*md.notna().sum()/N:.1f}%)')
print(f'year only in details              : {yr.notna().sum():,}  ({100*yr.notna().sum()/N:.1f}%)  {int(yr.min())}..{int(yr.max())}')
print(f'year embedded in slide_no          : {syr.notna().sum():,}  ({100*syr.notna().sum()/N:.1f}%)  {int(syr.min())}..{int(syr.max())}')
best_year = yr.fillna(syr)
print(f'ANY year (details or slide_no)     : {best_year.notna().sum():,}  ({100*best_year.notna().sum()/N:.1f}%)')

print('\n-- day-precision dates per year --')
print(fd.dt.year.value_counts().sort_index().to_string())

# soil moisture range
sm = pd.read_csv('SIH_CSV/NE_India_Soil_Moisture_Master.csv')
smd = pd.to_datetime(sm.date, errors='coerce')
print(f'\nsoil moisture   : {smd.min().date()} .. {smd.max().date()}  ({smd.notna().sum():,} rows, {smd.dt.date.nunique()} distinct days)')
print('  distinct days per year:'); print(smd.dt.year.value_counts().sort_index().to_string())
print('  states:', sorted(sm.state.unique()))
rf = pd.read_csv('SIH_CSV/NE_India_IMD_Rainfall_1901_2017.csv')
print(f'\nrainfall        : {rf.YEAR.min()} .. {rf.YEAR.max()}  ANNUAL/MONTHLY only (no daily), subdivisions: {sorted(rf.SUBDIVISION.unique())}')

# overlap
print('\n=== OVERLAP ===')
sm_days = set(smd.dt.normalize().dropna())
ov = fd.dropna()
ov_in_sm = ov[(ov>=smd.min())&(ov<=smd.max())]
print(f'day-precision slides inside SM window (2018-01-06..2020-12-09): {len(ov_in_sm):,}')
exact = ov.isin(sm_days).sum()
print(f'day-precision slides landing on a day SM actually has a reading: {exact:,}')
rf_ov = best_year[(best_year>=1901)&(best_year<=2017)]
print(f'slides with a year inside rainfall window (1901-2017): {rf_ov.notna().sum():,}')
