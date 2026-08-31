import { useEffect, useState } from 'react'

/**
 * Loads the risk grid once. Returns the raw FeatureCollection (handed straight
 * to MapLibre), a flat array of cell properties for JS-side ranking, and the
 * file's metadata block when it has one.
 *
 * Cell objects carry every property the file provides, not a fixed list: the
 * Northeast grid ships state, district and a different predictor set from the
 * old district grid, and older files lack fields the new one has. Nothing here
 * invents values - the UI renders what is present and says so when a field is
 * absent.
 *
 * Files above PROGRESS_THRESHOLD_BYTES are streamed so the loading overlay can
 * show real progress. The Northeast grid is several megabytes; a spinner that
 * sits still for that long reads as a hang.
 */

export const PROGRESS_THRESHOLD_BYTES = 3 * 1024 * 1024 // 3 MB

export function useRiskGrid(url = '/risk_grid.geojson') {
  const [state, setState] = useState({
    status: 'loading',
    geojson: null,
    cells: [],
    metadata: null,
    error: null,
    progress: null, // { loaded, total, ratio } once a large file starts streaming
  })

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`)

        const total = Number(res.headers.get('Content-Length')) || 0
        const text =
          total > PROGRESS_THRESHOLD_BYTES && res.body
            ? await readWithProgress(res, total, (loaded) => {
                if (cancelled) return
                setState((s) =>
                  s.status === 'loading'
                    ? {
                        ...s,
                        progress: {
                          loaded,
                          total,
                          // Over a gzipped response Content-Length is the
                          // compressed size while the reader yields decoded
                          // bytes, so the raw ratio can exceed 1.
                          ratio: Math.min(loaded / total, 1),
                        },
                      }
                    : s,
                )
              })
            : await res.text()

        const data = JSON.parse(text)
        if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
          throw new Error('Not a GeoJSON FeatureCollection')
        }

        const cells = data.features.map((f, i) => {
          const p = f.properties || {}
          return {
            // everything the file carries, so new predictors need no code change
            ...p,
            index: i,
            cell_id: p.cell_id ?? `CELL_${i}`,
            lat: num(p.lat),
            lon: num(p.lon),
            susceptibility: num(p.susceptibility) ?? 0,
            suscept_class: p.suscept_class ?? null,
            nearest_village: p.nearest_village ?? null,
            population: num(p.population),
            population_estimated: p.population_estimated === true,
          }
        })

        if (cancelled) return
        setState({
          status: 'ready',
          geojson: data,
          cells,
          metadata: data.metadata ?? null,
          error: null,
          progress: null,
        })
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return
        setState({
          status: 'error',
          geojson: null,
          cells: [],
          metadata: null,
          error: err.message || String(err),
          progress: null,
        })
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  return state
}

/** Drain the response body, reporting bytes as they land. */
async function readWithProgress(res, total, onProgress) {
  const reader = res.body.getReader()
  const chunks = []
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    loaded += value.length
    onProgress(loaded)
  }
  const merged = new Uint8Array(loaded)
  let at = 0
  for (const c of chunks) {
    merged.set(c, at)
    at += c.length
  }
  return new TextDecoder('utf-8').decode(merged)
}

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
