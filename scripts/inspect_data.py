"""STEP 1 - Inspect every CSV in SIH_CSV before any modelling."""
import os, sys, glob
import pandas as pd
import numpy as np

pd.set_option('display.width', 250)
pd.set_option('display.max_columns', 200)

CSV_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'SIH_CSV')

ENCODINGS = ['utf-8', 'latin-1', 'cp1252']


def read_csv_robust(path, **kw):
    """Try several encodings; return (df, encoding_used)."""
    last = None
    for enc in ENCODINGS:
        try:
            df = pd.read_csv(path, encoding=enc, low_memory=False, **kw)
            return df, enc
        except UnicodeDecodeError as e:
            last = e
            continue
        except Exception as e:
            last = e
            break
    raise RuntimeError(f"Could not read {path}: {last}")


LAT_HINTS = ('lat', 'latitude', 'y')
LON_HINTS = ('lon', 'lng', 'long', 'longitude', 'x')
DATE_HINTS = ('date', 'time', 'year', 'month', 'day', 'event', 'occur')


def looks_like(col, hints):
    c = col.strip().lower().replace(' ', '_')
    return any(c == h or c.startswith(h + '_') or c.endswith('_' + h) or h in c for h in hints)


def inspect(path):
    name = os.path.basename(path)
    print('\n' + '=' * 100)
    print(f'FILE: {name}   ({os.path.getsize(path)/1024:.1f} KB)')
    print('=' * 100)
    try:
        df, enc = read_csv_robust(path)
    except Exception as e:
        print(f'  !! FAILED TO READ: {e}')
        return None
    print(f'encoding used : {enc}')
    print(f'rows          : {len(df):,}')
    print(f'columns       : {df.shape[1]}')
    print('\n-- column names --')
    print(list(df.columns))
    print('\n-- dtypes / non-null / n-unique --')
    info = pd.DataFrame({
        'dtype': df.dtypes.astype(str),
        'non_null': df.notna().sum(),
        'nulls': df.isna().sum(),
        'n_unique': [df[c].nunique(dropna=True) for c in df.columns],
    })
    print(info.to_string())
    print('\n-- first 3 rows --')
    print(df.head(3).to_string())

    # lat / lon ranges
    latlon = [c for c in df.columns if looks_like(c, LAT_HINTS) or looks_like(c, LON_HINTS)]
    # narrow: only numeric ones
    latlon = [c for c in latlon if pd.api.types.is_numeric_dtype(df[c])]
    if latlon:
        print('\n-- candidate lat/lon columns: min / max --')
        for c in latlon:
            s = pd.to_numeric(df[c], errors='coerce')
            print(f'   {c:<30} min={s.min():>12.5f}  max={s.max():>12.5f}  n={s.notna().sum():,}')

    # date-ish columns
    datecols = [c for c in df.columns if looks_like(c, DATE_HINTS)]
    if datecols:
        print('\n-- candidate date columns --')
        for c in datecols:
            s = df[c]
            if pd.api.types.is_numeric_dtype(s):
                v = pd.to_numeric(s, errors='coerce')
                print(f'   {c:<30} NUMERIC  min={v.min()}  max={v.max()}  parsed={v.notna().sum():,}/{len(v):,}')
                continue
            parsed = pd.to_datetime(s, errors='coerce', format='mixed', dayfirst=True)
            n = parsed.notna().sum()
            if n:
                print(f'   {c:<30} parsed={n:,}/{len(s):,} ({100*n/len(s):.1f}%)  range={parsed.min()} .. {parsed.max()}')
            else:
                print(f'   {c:<30} parsed=0/{len(s):,}  sample={list(s.dropna().astype(str).head(3))}')

    # numeric summary for terrain-ish files
    num = df.select_dtypes(include=[np.number])
    if num.shape[1] and num.shape[1] <= 40:
        print('\n-- numeric describe --')
        print(num.describe().T.to_string())
    return df


def main():
    files = sorted(glob.glob(os.path.join(CSV_DIR, '*.csv')))
    print(f'Found {len(files)} CSV files in {CSV_DIR}')
    for f in files:
        inspect(f)
    print('\n' + '=' * 100)
    print('INSPECTION COMPLETE')
    print('=' * 100)


if __name__ == '__main__':
    main()
