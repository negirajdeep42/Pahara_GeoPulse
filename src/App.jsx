import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from './components/Header'
import Legend from './components/Legend'
import MapView from './components/MapView'
import PriorityList from './components/PriorityList'
import RainfallPanel from './components/RainfallPanel'
import CellInspector from './components/CellInspector'
import AlertsPanel from './components/AlertsPanel'
import Toasts from './components/Toasts'
import ReportModal from './components/ReportModal'
import SensorPanel from './components/SensorPanel'
import MethodologyModal from './components/MethodologyModal'
import PlaceSearch from './components/PlaceSearch'
import PlaceResultCard from './components/PlaceResultCard'
import { useRiskGrid } from './hooks/useRiskGrid'
import { usePlaces } from './hooks/usePlaces'
import { pushRecent, resolvePlace } from './lib/placeSearch'
import { computeTrigger } from './lib/riskEngine'
import { buildRainfallNodes, fetchRainfallGrid } from './lib/openMeteo'
import { meanTrigger, peakRain, scoreCells } from './lib/spatialRisk'

// A modest wet-season scenario so the live-risk layer has structure the moment
// it is opened. Clearly badged SIMULATED until real figures are fetched.
const DEFAULT_RAIN = { rain24h: 45, rain7d: 120, source: 'sim' }

export default function App() {
  const { t } = useTranslation()
  const { status, geojson, cells, metadata, error, progress } = useRiskGrid()
  // Loaded once and cached here. If it fails the search bar is hidden rather
  // than rendered broken, so `placesStatus` is load-bearing.
  const { status: placesStatus, places } = usePlaces()

  const [colorMode, setColorMode] = useState('susceptibility')
  // `rain` is the uniform what-if scenario driven by the sliders. `rainField`
  // is the live 0.5 deg lattice; when it is set it takes precedence per cell.
  const [rain, setRain] = useState(DEFAULT_RAIN)
  const [rainField, setRainField] = useState(null)
  const [rainProgress, setRainProgress] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [selected, setSelected] = useState(null)
  const [toasts, setToasts] = useState([])
  const [alertLog, setAlertLog] = useState([])
  const [reports, setReports] = useState([])
  const [reportOpen, setReportOpen] = useState(false)
  const [methodOpen, setMethodOpen] = useState(false)
  const [placeResult, setPlaceResult] = useState(null)
  const mapRef = useRef(null)
  const deepLinkDone = useRef(false)

  // One rainfall node per 0.5 degrees of the modelled area - roughly 150 for
  // the eight states, fetched in two batched calls. Rainfall is never fetched
  // per risk cell; each cell reads the node it sits in.
  const rainNodes = useMemo(() => buildRainfallNodes(cells), [cells])

  // Every cell scored against whichever rainfall it should see.
  const scored = useMemo(
    () => scoreCells(cells, rainField, rain),
    [cells, rainField, rain],
  )

  const scoredById = useMemo(() => {
    const m = new Map()
    for (const c of scored) m.set(c.cell_id, c)
    return m
  }, [scored])

  // Per-cell risk for the map, only while a live field exists. In scenario
  // mode this stays null and MapLibre recolours from the scalar below, so
  // dragging a slider never walks thousands of features.
  const spatialRisk = useMemo(() => {
    if (!rainField) return null
    const m = new Map()
    for (const c of scored) m.set(c.cell_id, c.risk)
    return m
  }, [scored, rainField])

  // A single regional figure, still needed by the legend, the sensor node and
  // the alert message.
  const trigger = useMemo(
    () =>
      rainField && scored.length
        ? meanTrigger(scored)
        : computeTrigger(rain.rain24h, rain.rain7d),
    [rainField, scored, rain.rain24h, rain.rain7d],
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  const handleMapReady = useCallback((map) => {
    mapRef.current = map
  }, [])

  // From a map click: MapLibre hands back the raw feature properties, which
  // carry no rainfall. Swap in the scored cell so the drawer shows the same
  // numbers the map was painted with.
  const handleSelectCell = useCallback(
    (props) => {
      if (!props) return setSelected(null)
      setSelected(scoredById.get(props.cell_id) ?? props)
    },
    [scoredById],
  )

  // From the priority list: centre the map, then open the same drawer.
  const handleSelectFromList = useCallback((cell) => {
    setSelected(cell)
    const map = mapRef.current
    if (map && Number.isFinite(cell.lat) && Number.isFinite(cell.lon)) {
      map.flyTo({ center: [cell.lon, cell.lat], zoom: Math.max(map.getZoom(), 11), speed: 1.1 })
    }
  }, [])

  /**
   * A searched place, resolved against what is already in memory: no network
   * call, no refetch. The grid gives the cell, the rainfall field gives the
   * trigger, and the risk engine multiplies them - all of it already computed
   * in `scored`.
   */
  const handleSelectPlace = useCallback(
    (place) => {
      const result = resolvePlace(place, scored)
      setPlaceResult(result)
      pushRecent(place)

      // reflect the selection in the URL so the view can be shared or reloaded
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('place', place.name)
        window.history.replaceState({}, '', url)
      } catch {
        /* a malformed base URL is not worth failing a search over */
      }

      if (result.verdict === 'ok') {
        setSelected(result.cell)
        mapRef.current?.flyTo({ center: [place.lon, place.lat], zoom: 11, speed: 1.2 })
      } else {
        setSelected(null)
        if (result.verdict === 'unmonitored') {
          mapRef.current?.flyTo({ center: [place.lon, place.lat], zoom: 9, speed: 1.2 })
        }
      }
    },
    [scored],
  )

  const closePlaceResult = useCallback(() => {
    setPlaceResult(null)
    try {
      const url = new URL(window.location.href)
      url.searchParams.delete('place')
      window.history.replaceState({}, '', url)
    } catch {
      /* ignore */
    }
  }, [])

  // ?place=Aizawl on load runs that search once, after the data is in.
  useEffect(() => {
    if (deepLinkDone.current) return
    if (placesStatus !== 'ready' || status !== 'ready' || !scored.length) return
    deepLinkDone.current = true
    const wanted = new URLSearchParams(window.location.search).get('place')
    if (!wanted) return
    const hit =
      places.find((p) => p.name.toLowerCase() === wanted.trim().toLowerCase()) ||
      places.find((p) => p.name.toLowerCase().startsWith(wanted.trim().toLowerCase()))
    if (hit) handleSelectPlace(hit)
  }, [placesStatus, status, scored.length, places, handleSelectPlace])

  const handleRain = useCallback((rain24h, rain7d, source) => {
    setRain({ rain24h, rain7d, source })
    // Moving a slider is a what-if over the whole region, so the live spatial
    // field has to give way or the map would ignore the operator.
    if (source === 'sim') setRainField(null)
  }, [])

  // Live rainfall for the whole Northeast, in batched calls.
  const handleFetchLive = useCallback(
    async ({ signal } = {}) => {
      setRainProgress({ done: 0, total: rainNodes.length })
      try {
        const res = await fetchRainfallGrid(rainNodes, {
          signal,
          onProgress: (done, total) => setRainProgress({ done, total }),
        })
        setRainField(res.byKey)
        // Show the wettest node on the sliders: a regional mean would read as
        // calm while one valley is being hit.
        const peak = peakRain(scoreCells(cells, res.byKey, rain))
        setRain({ ...peak, source: 'live' })
        return res
      } finally {
        setRainProgress(null)
      }
    },
    [rainNodes, cells, rain],
  )

  const pushToast = useCallback((toast) => {
    setToasts((list) => [...list, { id: `${Date.now()}-${Math.random()}`, ...toast }])
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((x) => x.id !== id))
  }, [])

  const pushAlertLog = useCallback((entry) => {
    setAlertLog((list) => [entry, ...list].slice(0, 40))
  }, [])

  const handleReport = useCallback(
    (report) => {
      setReports((list) => [...list, report])
      pushToast({ tone: 'success', title: t('report.submitted'), detail: report.id })
      mapRef.current?.flyTo({ center: [report.lon, report.lat], zoom: 12, speed: 1.1 })
    },
    [pushToast, t],
  )

  const mapCentre = () => {
    const c = mapRef.current?.getCenter()
    return c ? { lat: c.lat, lon: c.lng } : { lat: 25.4, lon: 93.0 }
  }

  return (
    <div className="flex h-full flex-col">
      <Header
        colorMode={colorMode}
        onColorMode={setColorMode}
        online={online}
        onMethodology={() => setMethodOpen(true)}
        search={
          placesStatus === 'ready' ? (
            <PlaceSearch
              places={places}
              rainField={rainField}
              uniformRain={rain}
              onSelect={handleSelectPlace}
              compact
            />
          ) : null
        }
      />

      <main className="relative flex-1 overflow-hidden">
        <MapView
          geojson={geojson}
          colorMode={colorMode}
          trigger={trigger}
          spatialRisk={spatialRisk}
          selectedCellId={selected?.cell_id ?? null}
          reports={reports}
          reportLabels={{
            title: t('report.markerTitle'),
            reportedAt: t('report.reportedAt'),
          }}
          onSelectCell={handleSelectCell}
          onMapReady={handleMapReady}
        />

        {/* left control column - leaves room for the sensor panel below */}
        <div className="scroll-thin pointer-events-none absolute left-3 top-3 z-20 flex max-h-[calc(100%-15rem)] flex-col gap-2 overflow-y-auto pr-1">
          {/* the header carries this on phones instead - see Header.jsx */}
          {placesStatus === 'ready' && (
            <div className="pointer-events-auto hidden lg:block">
              <PlaceSearch
                places={places}
                rainField={rainField}
                uniformRain={rain}
                onSelect={handleSelectPlace}
              />
            </div>
          )}
          <RainfallPanel
            rain24h={rain.rain24h}
            rain7d={rain.rain7d}
            source={rain.source}
            onChange={handleRain}
            onFetchLive={handleFetchLive}
            nodeCount={rainNodes.length}
            progress={rainProgress}
          />
          <PriorityList
            cells={scored}
            selectedCellId={selected?.cell_id ?? null}
            onSelect={handleSelectFromList}
          />
        </div>

        {/* bottom-left sensor node */}
        <div className="pointer-events-none absolute bottom-4 left-3 z-20">
          <SensorPanel trigger={trigger} />
        </div>

        {/* right drawer: the search result card sits above the inspector */}
        {(selected || placeResult) && (
          <div className="pointer-events-none absolute right-0 top-0 z-30 flex h-full flex-col items-end">
            {placeResult && (
              <PlaceResultCard
                result={placeResult}
                features={metadata?.features ?? null}
                importance={metadata?.feature_importance ?? null}
                onClose={closePlaceResult}
              />
            )}
            {selected && (
              <div className="min-h-0 flex-1">
                <CellInspector
                  cell={selected}
                  trigger={trigger}
                  rain24h={rain.rain24h}
                  rain7d={rain.rain7d}
                  features={metadata?.features ?? null}
                  importance={metadata?.feature_importance ?? null}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        )}

        {/* top-right alerts */}
        <div
          className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-2 transition-transform duration-200"
          style={{ transform: selected || placeResult ? 'translateX(-340px)' : 'none' }}
        >
          <AlertsPanel
            cells={scored}
            trigger={trigger}
            rain={rain}
            log={alertLog}
            onToast={pushToast}
            onLogged={pushAlertLog}
          />
        </div>

        {/* bottom-right legend, above the maplibre controls */}
        <div
          className="pointer-events-none absolute bottom-4 right-3 z-20 flex flex-col items-end gap-2 transition-transform duration-200"
          style={{ transform: selected || placeResult ? 'translateX(-340px)' : 'none' }}
        >
          <Legend colorMode={colorMode} trigger={trigger} />
        </div>

        {/* citizen reporting */}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="btn btn-primary absolute bottom-5 left-1/2 z-30 -translate-x-1/2 !rounded-full !px-4 !py-3 shadow-2xl shadow-black/60"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          {t('report.fab')}
        </button>

        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          onSubmit={handleReport}
          defaultCenter={reportOpen ? mapCentre() : null}
        />

        <MethodologyModal
          open={methodOpen}
          metadata={metadata}
          cellCount={cells.length}
          onClose={() => setMethodOpen(false)}
        />

        <Toasts toasts={toasts} onDismiss={dismissToast} />

        {status === 'loading' && (
          <LoadingOverlay label={t('app.loading')} progress={progress} />
        )}
        {status === 'error' && (
          <ErrorOverlay
            title={t('app.loadError')}
            hint={t('app.loadErrorHint')}
            detail={error}
            retryLabel={t('app.retry')}
          />
        )}

      </main>
    </div>
  )
}

/**
 * A spinner is fine for a file that arrives in a blink. The Northeast grid is
 * several megabytes, so once the hook reports byte progress this switches to a
 * real bar - a still spinner for that long reads as a hang.
 */
function LoadingOverlay({ label, progress }) {
  const pct = progress && progress.total ? Math.round(progress.ratio * 100) : null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink-900/80 backdrop-blur-sm">
      <div className="rounded border border-line bg-ink-800 px-5 py-4">
        <div className="flex items-center gap-3">
          {pct === null && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" />
          )}
          <span className="text-xs text-slate-300">{label}</span>
          {pct !== null && (
            <span className="tabular ml-auto text-xs font-semibold text-sky-300">{pct}%</span>
          )}
        </div>

        {pct !== null && (
          <>
            <div
              className="mt-3 h-1.5 w-64 overflow-hidden rounded-sm bg-ink-600"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
            >
              <div
                className="h-full rounded-sm bg-sky-400 transition-[width] duration-150"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="tabular mt-1.5 text-[10px] text-slate-500">
              {mb(progress.loaded)} / {mb(Math.max(progress.total, progress.loaded))} MB
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1)
}

function ErrorOverlay({ title, hint, detail, retryLabel }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm">
      <div className="max-w-sm rounded border border-red-900 bg-ink-800 p-5">
        <h2 className="text-sm font-semibold text-red-300">{title}</h2>
        <p className="mt-2 text-xs text-slate-400">{hint}</p>
        {detail && (
          <p className="tabular mt-2 break-words rounded border border-line bg-ink-900 p-2 text-[10px] text-slate-500">
            {detail}
          </p>
        )}
        <button className="btn mt-4 w-full" onClick={() => window.location.reload()}>
          {retryLabel}
        </button>
      </div>
    </div>
  )
}
