import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { riskPaintSpatial, susceptibilityPaint } from '../lib/colors'

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'
// Centred so all eight Northeastern states are on screen at load, rather than
// the single district the first version covered.
const CENTER = [93.0, 25.8]
const ZOOM = 6

const SRC = 'risk-grid'
const LYR_FILL = 'risk-grid-fill'
const LYR_LINE = 'risk-grid-line'
const LYR_HOVER = 'risk-grid-hover'
const LYR_DIM = 'basemap-dim'
const SRC_WORLD = 'world-veil'
const LYR_SELECTED = 'risk-grid-selected'
const SRC_REPORTS = 'citizen-reports'
const LYR_REPORTS = 'citizen-reports-dot'
const LYR_REPORTS_RING = 'citizen-reports-ring'

export default function MapView({
  geojson,
  colorMode,
  trigger,
  spatialRisk = null,
  selectedCellId,
  reports = [],
  reportLabels,
  onSelectCell,
  onMapReady,
}) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const hoveredRef = useRef(null)
  const [gridAdded, setGridAdded] = useState(false)
  const [styleReady, setStyleReady] = useState(false)
  const popupRef = useRef(null)
  const reportsRef = useRef(reports)
  reportsRef.current = reports
  const labelsRef = useRef(reportLabels)
  labelsRef.current = reportLabels

  // Keep the latest click handler without re-binding map events.
  const selectRef = useRef(onSelectCell)
  selectRef.current = onSelectCell

  // --- create the map once ------------------------------------------------
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: CENTER,
      zoom: ZOOM,
      minZoom: 6,
      maxZoom: 15,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
    })
    mapRef.current = map
    // Handy from the devtools console when tuning layers; dev builds only.
    if (import.meta.env.DEV) window.__PAHARA_MAP__ = map

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right')
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 110, unit: 'metric' }),
      'bottom-right',
    )
    map.touchZoomRotate.disableRotation()

    map.on('load', () => {
      setGridAdded(false) // triggers the data effect below
      setStyleReady(true)
      onMapReady?.(map)
    })

    return () => {
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
      setStyleReady(false)
    }
    // onMapReady is intentionally not a dependency: the map is created once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- add the grid source + layers when both map and data are ready ------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !geojson) return

    let cancelled = false
    const add = () => {
      if (cancelled || !map.isStyleLoaded() || map.getSource(SRC)) return

      // The Liberty basemap is a light cartographic style. A dimming veil
      // between it and the grid gives the operations-centre look without
      // touching the required style URL, and keeps the hazard colours the
      // brightest thing on screen.
      //
      // It has to be a *fill* over a world polygon: a `background` layer is
      // always painted in the background pass, no matter where it sits in the
      // layer order, so it would end up under the basemap instead of over it.
      if (!map.getSource(SRC_WORLD)) {
        map.addSource(SRC_WORLD, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
            type: 'Feature',
            // A regional box, not the whole globe: a polygon spanning the full
            // -180..180 range hits antimeridian handling and never draws.
            // This comfortably covers the viewport down to minZoom 6.
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [78, 10],
                  [108, 10],
                  [108, 40],
                  [78, 40],
                  [78, 10],
                ],
              ],
            },
            properties: {},
            }],
          },
        })
        map.addLayer({
          id: LYR_DIM,
          type: 'fill',
          source: SRC_WORLD,
          paint: { 'fill-color': '#070b10', 'fill-opacity': 0.62 },
        })
      }

      map.addSource(SRC, {
        // promoteId rather than generateId: feature-state is now addressed by
        // cell_id from outside this component, so the id has to be the cell's
        // own name and not a number assigned in load order.
        type: 'geojson',
        data: geojson,
        promoteId: 'cell_id',
      })

      map.addLayer({
        id: LYR_FILL,
        type: 'fill',
        source: SRC,
        paint: {
          'fill-color':
            colorMode === 'risk' ? riskPaintSpatial(trigger) : susceptibilityPaint(),
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.85,
            0.6,
          ],
        },
      })

      map.addLayer({
        id: LYR_LINE,
        type: 'line',
        source: SRC,
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.35,
          'line-opacity': 0.35,
        },
      })

      // Hover ring drawn on top of the thin grid lines.
      map.addLayer({
        id: LYR_HOVER,
        type: 'line',
        source: SRC,
        paint: {
          'line-color': '#e2e8f0',
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
          'line-opacity': 0.95,
        },
      })

      // Selected-cell ring, driven by setFilter from the inspector.
      map.addLayer({
        id: LYR_SELECTED,
        type: 'line',
        source: SRC,
        filter: ['==', ['get', 'cell_id'], '__none__'],
        paint: {
          'line-color': '#f8fafc',
          'line-width': 2.4,
          'line-opacity': 1,
        },
      })

      setGridAdded(true)
    }

    if (map.isStyleLoaded()) add()
    else map.once('load', add)

    return () => {
      cancelled = true
    }
    // colorMode/trigger are read once at creation; later changes go through
    // setPaintProperty in the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geojson])

  // --- interactions -------------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !gridAdded) return

    const clearHover = () => {
      if (hoveredRef.current !== null) {
        map.setFeatureState({ source: SRC, id: hoveredRef.current }, { hover: false })
        hoveredRef.current = null
      }
    }

    const onMove = (e) => {
      const f = e.features?.[0]
      if (!f) return
      if (hoveredRef.current === f.id) return
      clearHover()
      hoveredRef.current = f.id
      map.setFeatureState({ source: SRC, id: f.id }, { hover: true })
      map.getCanvas().style.cursor = 'pointer'
    }

    const onLeave = () => {
      clearHover()
      map.getCanvas().style.cursor = ''
    }

    const onClick = (e) => {
      const f = e.features?.[0]
      if (!f) return
      selectRef.current?.(f.properties)
    }

    map.on('mousemove', LYR_FILL, onMove)
    map.on('mouseleave', LYR_FILL, onLeave)
    map.on('click', LYR_FILL, onClick)

    return () => {
      map.off('mousemove', LYR_FILL, onMove)
      map.off('mouseleave', LYR_FILL, onLeave)
      map.off('click', LYR_FILL, onClick)
    }
  }, [gridAdded])

  // --- selected cell ring -------------------------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !gridAdded || !map.getLayer(LYR_SELECTED)) return
    map.setFilter(LYR_SELECTED, ['==', ['get', 'cell_id'], selectedCellId ?? '__none__'])
  }, [selectedCellId, gridAdded])

  // --- citizen reports: layer created once, data pushed on change ---------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !styleReady || map.getSource(SRC_REPORTS)) return

    map.addSource(SRC_REPORTS, { type: 'geojson', data: emptyFC() })

    // A deliberately different mark from the grid: a violet dot with a halo,
    // so a citizen observation is never mistaken for a modelled cell.
    map.addLayer({
      id: LYR_REPORTS_RING,
      type: 'circle',
      source: SRC_REPORTS,
      paint: {
        'circle-radius': 11,
        'circle-color': '#a855f7',
        'circle-opacity': 0.22,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#a855f7',
        'circle-stroke-opacity': 0.5,
      },
    })
    map.addLayer({
      id: LYR_REPORTS,
      type: 'circle',
      source: SRC_REPORTS,
      paint: {
        'circle-radius': 5.5,
        'circle-color': '#c084fc',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#f8fafc',
      },
    })

    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }
    const onClick = (e) => {
      const f = e.features?.[0]
      if (!f) return
      const report = reportsRef.current.find((r) => r.id === f.properties.id)
      if (!report) return
      popupRef.current?.remove()
      popupRef.current = new maplibregl.Popup({
        closeButton: true,
        maxWidth: '250px',
        offset: 12,
      })
        .setLngLat([report.lon, report.lat])
        .setDOMContent(buildReportPopup(report, labelsRef.current))
        .addTo(map)
    }

    map.on('mouseenter', LYR_REPORTS, onEnter)
    map.on('mouseleave', LYR_REPORTS, onLeave)
    map.on('click', LYR_REPORTS, onClick)

    return () => {
      map.off('mouseenter', LYR_REPORTS, onEnter)
      map.off('mouseleave', LYR_REPORTS, onLeave)
      map.off('click', LYR_REPORTS, onClick)
    }
  }, [styleReady])

  useEffect(() => {
    const map = mapRef.current
    const src = map?.getSource(SRC_REPORTS)
    if (!src) return
    src.setData({
      type: 'FeatureCollection',
      features: reports.map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lon, r.lat] },
        properties: { id: r.id },
      })),
    })
  }, [reports, styleReady])

  // --- recolour without touching the source -------------------------------
  useEffect(() => {
    const map = mapRef.current
    if (!map || !gridAdded || !map.getLayer(LYR_FILL)) return
    map.setPaintProperty(
      LYR_FILL,
      'fill-color',
      colorMode === 'risk' ? riskPaintSpatial(trigger) : susceptibilityPaint(),
    )
  }, [colorMode, trigger, gridAdded])

  // --- per-cell risk from the rainfall field ------------------------------
  // Only runs when a live field arrives or is cleared, never on a slider drag:
  // in scenario mode spatialRisk is null and the scalar expression above does
  // the work, so dragging stays a single paint-property swap.
  useEffect(() => {
    const map = mapRef.current
    if (!map || !gridAdded || !map.getSource(SRC)) return

    if (!spatialRisk) {
      map.removeFeatureState({ source: SRC }, 'risk')
      return
    }
    for (const [cellId, risk] of spatialRisk) {
      map.setFeatureState({ source: SRC, id: cellId }, { risk })
    }
  }, [spatialRisk, gridAdded])

  // h-full/w-full rather than `absolute inset-0`: maplibre-gl.css sets
  // `.maplibregl-map { position: relative }` on this very element and, loading
  // after Tailwind, wins the cascade - which would collapse an inset-0 box to
  // zero height.
  return <div ref={containerRef} className="h-full w-full bg-ink-900" />
}

function emptyFC() {
  return { type: 'FeatureCollection', features: [] }
}

/**
 * Popup content is built as DOM, not an HTML string: the description and file
 * name come from a person typing into a form, and must never be parsed as
 * markup.
 */
function buildReportPopup(report, labels = {}) {
  const root = document.createElement('div')
  root.style.cssText = 'width:230px;font-family:Inter,system-ui,sans-serif'

  if (report.photoUrl) {
    const img = document.createElement('img')
    img.src = report.photoUrl
    img.alt = ''
    img.style.cssText =
      'display:block;width:100%;height:130px;object-fit:cover;border-bottom:1px solid #22303f'
    root.appendChild(img)
  }

  const body = document.createElement('div')
  body.style.cssText = 'padding:9px 11px 11px'

  const kicker = document.createElement('div')
  kicker.textContent = labels.title || 'Citizen report'
  kicker.style.cssText =
    'font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#a855f7;font-weight:700'
  body.appendChild(kicker)

  const type = document.createElement('div')
  type.textContent = labels.type || report.type
  type.style.cssText = 'margin-top:3px;font-size:12px;font-weight:600;color:#e2e8f0'
  body.appendChild(type)

  if (report.description) {
    const desc = document.createElement('p')
    desc.textContent = report.description
    desc.style.cssText =
      'margin:6px 0 0;font-size:11px;line-height:1.5;color:#cbd5e1;white-space:pre-wrap'
    body.appendChild(desc)
  }

  const meta = document.createElement('div')
  meta.style.cssText =
    'margin-top:8px;padding-top:7px;border-top:1px solid #22303f;font-size:9px;color:#8296ab;font-family:JetBrains Mono,monospace;line-height:1.6'
  meta.textContent = `${report.id}\n${report.lat.toFixed(4)}N ${report.lon.toFixed(4)}E\n${
    labels.reportedAt || 'Reported'
  } ${report.createdAt.toLocaleString()}`
  meta.style.whiteSpace = 'pre-line'
  body.appendChild(meta)

  root.appendChild(body)
  return root
}
