// Open-Meteo forecast API. Free, no key, no account.
//
// The series returned by past_days=7&forecast_days=4 runs from seven days ago
// to the end of the third forecast day. We locate the CURRENT hour inside it
// and then sum backwards from four different points:
//
//   lead 0    the 24 h and 168 h ending now          - observed
//   lead +24  the 24 h and 168 h ending 24 h from now - part forecast
//   lead +48  ... and so on
//   lead +72
//
// That is the difference between a monitor and a warning system. A hillside
// that will be at Evacuate on Thursday is worth knowing about on Tuesday; by
// the time the observed window says so, the slope already knows.
//
// past_days=7 + forecast_days=4 is exactly the span +72 h needs: the current
// hour sits at index 168..191, and 191 + 72 = 263, the last index of an
// 11-day hourly series. Shortening the forecast window truncates the longest
// lead - see `truncated` on each lead.
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
const HOURLY_QUERY = 'hourly=precipitation&past_days=7&forecast_days=4'

/**
 * Forecast lead times, in hours. 0 is "now" and is pure observation; the rest
 * reach into the forecast. Every rainfall payload carries a window for each.
 */
export const LEAD_HOURS = [0, 24, 48, 72]

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
    ...summariseSeries(data),
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
      byKey.set(batch[k].key, summariseSeries(loc))
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

// -------------------------------------------------------------- lead times

/**
 * Project a lead-aware rainfall field onto one lead time.
 *
 * `fetchRainfallGrid` returns a node -> { rain24h, rain7d, leads } map. Every
 * consumer downstream of here - scoreCells, the place search, the inspector -
 * only ever wants one lead at a time, and wants it in the plain
 * { rain24h, rain7d } shape they already understand. This is the one place
 * that knows a lead exists.
 *
 * An unknown lead, or a node fetched before leads existed, falls back to the
 * node's own top-level figures, which are the observed ones.
 */
export function fieldAtLead(field, lead = 0) {
  if (!field) return null
  const out = new Map()
  for (const [key, node] of field) {
    const hit = node?.leads?.[lead]
    out.set(key, hit ? { rain24h: hit.rain24h, rain7d: hit.rain7d } : node)
  }
  return out
}

/**
 * The wettest node in a projected field.
 *
 * The sliders show this rather than a regional mean: a mean reads as calm
 * while one valley is being hit, and the valley is the whole point.
 */
export function peakField(field) {
  let rain24h = 0
  let rain7d = 0
  if (!field) return { rain24h, rain7d }
  for (const node of field.values()) {
    if (Number(node?.rain24h) > rain24h) rain24h = Number(node.rain24h)
    if (Number(node?.rain7d) > rain7d) rain7d = Number(node.rain7d)
  }
  return { rain24h, rain7d }
}

/** When the window for a lead ends, as returned by the API, or null. */
export function leadWindowEnd(field, lead = 0) {
  if (!field) return null
  for (const node of field.values()) {
    const at = node?.leads?.[lead]?.at
    if (at) return at
  }
  return null
}

/** True when the API did not reach far enough ahead to cover this lead. */
export function leadTruncated(field, lead = 0) {
  if (!field) return false
  for (const node of field.values()) {
    if (node?.leads?.[lead]) return Boolean(node.leads[lead].truncated)
  }
  return false
}

// ------------------------------------------------------------------ shared

/**
 * Hourly precipitation, summarised at every lead time.
 *
 * Returns the lead-0 figures at the top level - so every existing caller that
 * reads `rain24h` / `rain7d` keeps working and keeps meaning "observed" - with
 * the full set under `leads`.
 *
 * `at` is the clock, injectable so the windowing can be tested against a fixed
 * series instead of against whatever hour the suite happens to run in.
 */
export function summariseSeries(payload, at = Date.now()) {
  const series = payload?.hourly?.precipitation
  const times = payload?.hourly?.time
  const end = anchorIndex(times, series.length, at)

  const leads = {}
  for (const lead of LEAD_HOURS) {
    const stop = end + lead
    const clamped = Math.min(stop, series.length - 1)
    leads[lead] = {
      lead,
      rain24h: round1(sumWindow(series, clamped, 24)),
      rain7d: round1(sumWindow(series, clamped, 168)),
      at: Array.isArray(times) ? (times[clamped] ?? null) : null,
      // true when the API did not return far enough ahead to cover this lead,
      // in which case the figures are those of the furthest hour it did return
      truncated: stop > series.length - 1,
    }
  }

  return { ...leads[0], leads }
}

/**
 * Index of the hour the windows are measured from - the current hour.
 *
 * Open-Meteo timestamps look like `2026-09-03T14:00`, with no zone, in the
 * timezone the request asked for. We ask for none, so they are GMT and can be
 * read by appending seconds and a Z. If the timestamps are missing or
 * unparseable we fall back to the end of the observed week, which is where
 * past_days=7 puts it: index 167 is the last hour of yesterday.
 */
export function anchorIndex(times, length, at = Date.now()) {
  const fallback = Math.min(Math.max(length - 1, 0), 167)
  if (!Array.isArray(times) || times.length === 0) return fallback

  let lo = 0
  let hi = Math.min(times.length, length) - 1
  let best = -1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const ms = parseHour(times[mid])
    if (!Number.isFinite(ms)) return fallback
    if (ms <= at) {
      best = mid
      lo = mid + 1
    } else {
      hi = mid - 1
    }
  }
  return best < 0 ? fallback : best
}

/**
 * `2026-09-03T14:00` -> epoch ms, read as GMT unless it carries a zone.
 *
 * The shape is checked before parsing rather than after. `Date.parse` in V8
 * falls back to a legacy parser that accepts almost anything - `Date.parse
 * ('nonsense:00Z')` is 1 Jan 2000, not NaN - so appending `:00Z` to an
 * unrecognised string and trusting the result would silently anchor every
 * window to the wrong hour instead of falling back.
 */
const HOUR_STAMP = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})(?::\d{2}(?:\.\d+)?)?([Zz]|[+-]\d{2}:?\d{2})?$/

export function parseHour(stamp) {
  if (typeof stamp !== 'string') return NaN
  const m = HOUR_STAMP.exec(stamp.trim())
  if (!m) return NaN
  return Date.parse(m[2] ? stamp.trim() : `${m[1]}:00Z`)
}

/** Sum of `hours` values ending at `endIdx` inclusive. */
function sumWindow(series, endIdx, hours) {
  let total = 0
  for (let i = Math.max(0, endIdx - hours + 1); i <= endIdx; i += 1) {
    const n = Number(series[i])
    if (Number.isFinite(n)) total += n
  }
  return total
}

function lastTime(payload) {
  const times = payload?.hourly?.time
  return Array.isArray(times) && times.length ? times[times.length - 1] : null
}

function round1(n) {
  return Math.round(n * 10) / 10
}
