// Open-Meteo forecast API. Free, no key, no account.
//
// The series returned by past_days=7&forecast_days=1 runs from seven days ago
// to the end of tomorrow. We sum the LAST 24 and LAST 168 hourly values, so
// the figures deliberately include the coming forecast day - for an early
// warning system, rain that is about to fall matters as much as rain that
// just did.
//
// Two shapes of request live here:
//
//   fetchRainfall()      one point, for the operator's district-level readout
//   fetchRainfallGrid()  a coarse 0.5 deg lattice covering the whole Northeast
//
// The grid exists because the risk grid now spans eight states. Asking for
// rainfall per risk cell would be thousands of requests for a field that
// varies over tens of kilometres; a 0.5 deg lattice is ~150 points, fetched in
// two batched calls, and every risk cell reads from the node containing it.

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast'
const HOURLY_QUERY = 'hourly=precipitation&past_days=7&forecast_days=1'

export const OPEN_METEO_URL =
  `${FORECAST_BASE}?latitude=25.4&longitude=93.0&${HOURLY_QUERY}`

export const DISTRICT_POINT = { lat: 25.4, lon: 93.0 }

/** Edge length of one rainfall node, in degrees. */
export const RAIN_NODE_DEG = 0.5

/** Open-Meteo accepts at most 100 coordinate pairs in one call. */
export const RAIN_BATCH = 100

export async function fetchRainfall({ signal } = {}) {
  const res = await fetch(OPEN_METEO_URL, { signal })
  if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`)

  const data = await res.json()
  const series = data?.hourly?.precipitation
  if (!Array.isArray(series) || series.length === 0) {
    throw new Error('No precipitation series in the response')
  }

  return {
    ...summarise(series),
    hours: series.length,
    windowEnd: lastTime(data),
    fetchedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------- the grid

/**
 * The set of 0.5 deg rainfall nodes needed to cover a set of risk cells.
 *
 * Nodes are derived from the cells rather than from a fixed bounding box, so
 * empty ocean and the parts of the bbox outside the modelled states cost
 * nothing. Every cell is guaranteed a node, because its own node is what put
 * that node in the list.
 */
export function buildRainfallNodes(cells, step = RAIN_NODE_DEG) {
  const seen = new Map()
  for (const c of cells) {
    const lat = Number(c?.lat)
    const lon = Number(c?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    const gy = Math.floor(lat / step)
    const gx = Math.floor(lon / step)
    const key = `${gy}:${gx}`
    if (!seen.has(key)) {
      // sample at the node centre, not a corner
      seen.set(key, { key, gy, gx, lat: (gy + 0.5) * step, lon: (gx + 0.5) * step })
    }
  }
  return Array.from(seen.values())
}

/** The node key a coordinate falls in. Pairs with buildRainfallNodes. */
export function nodeKeyFor(lat, lon, step = RAIN_NODE_DEG) {
  const a = Number(lat)
  const b = Number(lon)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null
  return `${Math.floor(a / step)}:${Math.floor(b / step)}`
}

/**
 * Fetch rainfall for every node, in batches of at most RAIN_BATCH.
 *
 * Returns a Map of node key -> { rain24h, rain7d }. onProgress reports
 * completed nodes so the UI can show real progress rather than a spinner.
 */
export async function fetchRainfallGrid(nodes, { signal, batchSize = RAIN_BATCH, onProgress } = {}) {
  const byKey = new Map()
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return { byKey, fetchedAt: new Date().toISOString(), nodeCount: 0, requests: 0 }
  }

  let requests = 0
  let windowEnd = null

  for (let i = 0; i < nodes.length; i += batchSize) {
    const batch = nodes.slice(i, i + batchSize)
    const url =
      `${FORECAST_BASE}?latitude=${batch.map((n) => n.lat.toFixed(4)).join(',')}` +
      `&longitude=${batch.map((n) => n.lon.toFixed(4)).join(',')}` +
      `&${HOURLY_QUERY}`

    const res = await fetch(url, { signal })
    if (!res.ok) {
      throw new Error(`Open-Meteo returned HTTP ${res.status} for rainfall batch ${requests + 1}`)
    }
    const json = await res.json()
    // A multi-location request returns an array; a single location returns a
    // bare object. Accept both so a one-node region still works.
    const list = Array.isArray(json) ? json : [json]
    if (list.length !== batch.length) {
      throw new Error(
        `Open-Meteo returned ${list.length} locations for a batch of ${batch.length}`,
      )
    }

    list.forEach((loc, k) => {
      const series = loc?.hourly?.precipitation
      if (!Array.isArray(series) || series.length === 0) return
      byKey.set(batch[k].key, summarise(series))
      windowEnd = windowEnd || lastTime(loc)
    })

    requests += 1
    onProgress?.(Math.min(i + batch.length, nodes.length), nodes.length)
  }

  if (byKey.size === 0) throw new Error('No precipitation series in any rainfall node')

  return {
    byKey,
    nodeCount: byKey.size,
    requests,
    windowEnd,
    fetchedAt: new Date().toISOString(),
  }
}

// ------------------------------------------------------------------ shared

function summarise(series) {
  const sumLast = (n) =>
    series.slice(-n).reduce((acc, v) => acc + (Number.isFinite(Number(v)) ? Number(v) : 0), 0)
  return { rain24h: round1(sumLast(24)), rain7d: round1(sumLast(168)) }
}

function lastTime(payload) {
  const times = payload?.hourly?.time
  return Array.isArray(times) && times.length ? times[times.length - 1] : null
}

function round1(n) {
  return Math.round(n * 10) / 10
}
