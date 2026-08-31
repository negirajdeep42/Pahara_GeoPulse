"""Fetch admin boundaries and settlements for NE India from OpenStreetMap / Overpass.

The supplied CSVs carry no district, village or population fields, so the
state/district/settlement attributes the deliverables ask for come from OSM.
Everything is cached to data/cache/ so a re-run costs nothing.
"""
import os, sys, json, time
import requests

LAT_MIN, LAT_MAX = 21.5, 29.6
LON_MIN, LON_MAX = 87.8, 97.5

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_DIR = os.path.join(ROOT, 'data', 'cache')
ENDPOINT = 'https://overpass-api.de/api/interpreter'
HEADERS = {'User-Agent': 'NE-India-landslide-susceptibility/1.0 (research)'}
BBOX = f'{LAT_MIN},{LON_MIN},{LAT_MAX},{LON_MAX}'


def overpass(query, cache_name, retries=4):
    path = os.path.join(CACHE_DIR, cache_name)
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        print(f'  [cached] {cache_name} ({os.path.getsize(path)/1e6:.1f} MB)', flush=True)
        with open(path, encoding='utf-8') as fh:
            return json.load(fh)
    for attempt in range(retries):
        t = time.time()
        try:
            r = requests.post(ENDPOINT, data={'data': query}, headers=HEADERS, timeout=600)
        except Exception as e:
            print(f'  attempt {attempt+1}: {type(e).__name__} {str(e)[:80]}', flush=True)
            time.sleep(20 * (attempt + 1))
            continue
        if r.status_code == 200:
            data = r.json()
            with open(path, 'w', encoding='utf-8') as fh:
                json.dump(data, fh)
            print(f'  fetched {cache_name}: {len(data["elements"]):,} elements, '
                  f'{len(r.content)/1e6:.1f} MB, {time.time()-t:.0f}s', flush=True)
            return data
        print(f'  attempt {attempt+1}: HTTP {r.status_code} after {time.time()-t:.0f}s', flush=True)
        time.sleep(30 * (attempt + 1))
    raise RuntimeError(f'Overpass failed for {cache_name} after {retries} attempts')


def main():
    os.makedirs(CACHE_DIR, exist_ok=True)

    print('[1/3] state boundaries (admin_level=4, India only)', flush=True)
    overpass(f'''[out:json][timeout:500];
relation["boundary"="administrative"]["admin_level"="4"]["ISO3166-2"~"^IN-"]({BBOX});
out geom;''', 'osm_states.json')

    print('[2/3] district boundaries (admin_level=5)', flush=True)
    overpass(f'''[out:json][timeout:500];
relation["boundary"="administrative"]["admin_level"="5"]({BBOX});
out geom;''', 'osm_districts.json')

    print('[3/3] settlements (place=city|town|village), in latitude bands', flush=True)
    # one band per 2 degrees of latitude keeps each response well inside the
    # public instance's timeout and memory budget
    bands = []
    lo = LAT_MIN
    while lo < LAT_MAX:
        hi = min(lo + 2.0, LAT_MAX)
        bands.append((lo, hi))
        lo = hi
    total = 0
    for i, (a, b) in enumerate(bands):
        d = overpass(f'''[out:json][timeout:500];
node["place"~"^(city|town|village)$"]["name"]({a},{LON_MIN},{b},{LON_MAX});
out body;''', f'osm_places_band{i}.json')
        total += len(d['elements'])
        time.sleep(3)   # be polite to the public instance between bands
    print(f'\nsettlement nodes fetched: {total:,} across {len(bands)} bands', flush=True)
    print('OSM fetch complete', flush=True)


if __name__ == '__main__':
    main()
