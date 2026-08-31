"""Run the full pipeline end to end: DEM -> grid -> model -> ./out.

Only waits on the Open-Meteo quota when that is the chosen DEM provider. The
default provider (opentopodata) has a separate budget, so there is nothing to
wait for.

  python scripts/run_all.py
  SIH_DEM_SOURCE=open-meteo python scripts/run_all.py
"""
import subprocess, sys, os, time
import requests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PY = sys.executable
SOURCE = os.environ.get('SIH_DEM_SOURCE', 'opentopodata')


def quota_ready():
    try:
        r = requests.post('https://api.open-meteo.com/v1/elevation',
                          data={'latitude': '25.0', 'longitude': '93.0'},
                          headers={'User-Agent': 'quota-probe'}, timeout=30)
        return r.status_code == 200, r.text[:90]
    except Exception as e:
        return False, '%s %s' % (type(e).__name__, str(e)[:60])


def wait_for_quota(limit_minutes=90):
    print('waiting for the Open-Meteo hourly quota to roll over...', flush=True)
    waited = 0
    while True:
        ok, msg = quota_ready()
        if ok:
            print('quota clear after %d min - starting fetch' % (waited // 60), flush=True)
            return
        print('  [%s] still throttled: %s' % (time.strftime('%H:%M:%S'), msg), flush=True)
        time.sleep(120)
        waited += 120
        if waited > limit_minutes * 60:
            print('gave up waiting after %d min' % limit_minutes, flush=True)
            sys.exit(1)


def main():
    if SOURCE == 'open-meteo':
        wait_for_quota()
    else:
        print('DEM source: %s - no Open-Meteo quota wait needed' % SOURCE, flush=True)

    for script in ['fetch_dem.py', 'build_grid.py', 'train_susceptibility.py']:
        print('\n' + '#' * 70, flush=True)
        print('# RUNNING %s' % script, flush=True)
        print('#' * 70, flush=True)
        rc = subprocess.call([PY, '-u', os.path.join(ROOT, 'scripts', script)])
        if rc != 0:
            print('\n%s exited with code %d - stopping' % (script, rc), flush=True)
            sys.exit(rc)
    print('\nPIPELINE COMPLETE', flush=True)


if __name__ == '__main__':
    main()
