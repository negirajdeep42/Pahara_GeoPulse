// Plain-node checks for the rainfall layer. Run: npm run test:rain
//
// The interesting behaviour here is windowing: given a real-shaped Open-Meteo
// payload, does each forecast lead sum the right 24 and 168 hours? Everything
// is driven off a synthetic series where hour i contributes i mm, so a window
// sum is an arithmetic series and the expected value can be written down
// independently of the implementation.
import assert from 'node:assert/strict'
import {
  LEAD_HOURS,
  RAIN_NODE_DEG,
  anchorIndex,
  buildRainfallNodes,
  fieldAtLead,
  leadTruncated,
  leadWindowEnd,
  nodeKeyFor,
  peakField,
  summariseSeries as summarise,
} from './openMeteo.js'

// Same counting idiom as render.test.mjs: thin wrappers so the printed total
// reflects assertions actually executed, loops included.
let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks += 1 }
const eq = (a, b, msg) => { assert.equal(a, b, msg); checks += 1 }
const ne = (a, b, msg) => { assert.notEqual(a, b, msg); checks += 1 }
const deep = (a, b, msg) => { assert.deepEqual(a, b, msg); checks += 1 }

const near = (a, b, eps = 0.11) => Math.abs(a - b) < eps

// A payload shaped exactly like past_days=7&forecast_days=4: 11 days of hours
// starting at midnight GMT seven days before `day`.
function payload({ start, hours = 264, value = () => 1 }) {
  const time = []
  const precipitation = []
  for (let i = 0; i < hours; i += 1) {
    time.push(new Date(start + i * 3600e3).toISOString().slice(0, 16))
    precipitation.push(value(i))
  }
  return { hourly: { time, precipitation } }
}

const START = Date.UTC(2026, 8, 1, 0, 0) // 1 Sep 2026, 00:00 GMT
const NOW = Date.UTC(2026, 8, 8, 14, 30) // 8 Sep, 14:30 -> hour index 182

// --- anchorIndex ----------------------------------------------------------
const p = payload({ start: START })
eq(anchorIndex(p.hourly.time, 264, NOW), 182, 'the current hour is found')
eq(
  anchorIndex(p.hourly.time, 264, Date.UTC(2026, 8, 8, 14, 0)),
  182,
  'exactly on the hour belongs to that hour',
)
eq(
  anchorIndex(p.hourly.time, 264, Date.UTC(2026, 8, 1, 0, 0)),
  0,
  'the very first hour of the series',
)
eq(anchorIndex(null, 264, NOW), 167, 'no timestamps falls back to the observed week')
eq(anchorIndex(['nonsense'], 264, NOW), 167, 'unparseable timestamps fall back too')
eq(anchorIndex([], 12, NOW), 11, 'a short series falls back to its own last hour')

// --- lead windows ---------------------------------------------------------
// hour i contributes i mm, so the 24 h ending at index e sums e-23 .. e.
const ramp = payload({ start: START, value: (i) => i })
const sumTo = (e, n) => ((e - n + 1 + e) * n) / 2

const s = summarise(ramp, NOW)
deep(Object.keys(s.leads).map(Number), LEAD_HOURS, 'every lead is present')

for (const lead of LEAD_HOURS) {
  const e = 182 + lead
  ok(near(s.leads[lead].rain24h, sumTo(e, 24)), `lead +${lead} sums the right 24 h`)
  ok(near(s.leads[lead].rain7d, sumTo(e, 168)), `lead +${lead} sums the right 168 h`)
  eq(s.leads[lead].truncated, false, `lead +${lead} fits inside 11 days`)
  eq(s.leads[lead].at, ramp.hourly.time[e], `lead +${lead} reports its own end hour`)
}

// +72 h is exactly the last hour the API returns. This is why the request asks
// for forecast_days=4 and not 3 - it is the tightest window that fits.
eq(s.leads[72].at, '2026-09-11T14:00')
eq(anchorIndex(ramp.hourly.time, 264, Date.UTC(2026, 8, 8, 23, 30)) + 72, 263)

// lead 0 is lifted to the top level so existing callers keep working
eq(s.rain24h, s.leads[0].rain24h, 'top-level figures are the observed ones')
eq(s.rain7d, s.leads[0].rain7d)
ok(s.leads[24].rain24h > s.leads[0].rain24h, 'a rising ramp means later windows are wetter')

// --- truncation -----------------------------------------------------------
// forecast_days=1, the old request: the series stops at the end of tomorrow,
// so +48 and +72 cannot be answered and say so rather than inventing a figure.
const short = payload({ start: START, hours: 192, value: (i) => i })
const t = summarise(short, NOW)
eq(t.leads[0].truncated, false)
eq(t.leads[24].truncated, true, '+24 h runs past the end of a 1-day forecast')
eq(t.leads[72].truncated, true)
eq(t.leads[72].rain24h, t.leads[24].rain24h, 'truncated leads clamp to the last hour')

// --- windows never read before the start of the series --------------------
const tiny = payload({ start: START, hours: 6, value: () => 2 })
const u = summarise(tiny, Date.UTC(2026, 8, 1, 5, 0))
eq(u.rain24h, 12, 'a 6-hour series sums 6 hours, not 24 hours of undefined')
eq(u.rain7d, 12)

// --- non-numeric values are skipped, not propagated as NaN ----------------
const holes = payload({ start: START, value: (i) => (i % 2 ? null : 1) })
ok(Number.isFinite(summarise(holes, NOW).rain24h), 'nulls in the series do not poison the sum')
eq(summarise(holes, NOW).rain24h, 12, 'half the hours report, and they are counted')

// --- nodes ----------------------------------------------------------------
const cells = [
  { lat: 25.2, lon: 93.1 },
  { lat: 25.4, lon: 93.4 }, // same 0.5 deg node as the first
  { lat: 26.9, lon: 94.6 },
  { lat: NaN, lon: 1 }, // ignored
]
const nodes = buildRainfallNodes(cells)
eq(nodes.length, 2, 'cells sharing a node share a request')
ok(
  nodes.every((n) => Number.isFinite(n.lat) && Number.isFinite(n.lon)),
  'every node has a sample point',
)
eq(nodeKeyFor(25.2, 93.1), nodeKeyFor(25.4, 93.4), 'both cells resolve to one key')
ne(nodeKeyFor(25.2, 93.1), nodeKeyFor(26.9, 94.6))
eq(nodeKeyFor(NaN, 1), null)
eq(RAIN_NODE_DEG, 0.5)

// --- projecting a field onto one lead -------------------------------------
const field = new Map([
  ['a', { rain24h: 10, rain7d: 40, leads: { 0: { rain24h: 10, rain7d: 40, at: 'x', truncated: false }, 24: { rain24h: 55, rain7d: 90, at: 'y', truncated: false } } }],
  ['b', { rain24h: 30, rain7d: 20, leads: { 0: { rain24h: 30, rain7d: 20, at: 'x', truncated: false }, 24: { rain24h: 5, rain7d: 120, at: 'y', truncated: true } } }],
])

deep(fieldAtLead(field, 0).get('a'), { rain24h: 10, rain7d: 40 })
deep(fieldAtLead(field, 24).get('a'), { rain24h: 55, rain7d: 90 })
eq(fieldAtLead(null, 0), null, 'no field projects to no field')
// a lead the field does not carry falls back to the node's observed figures,
// so an old cached payload renders as "now" instead of as zero rainfall
deep(fieldAtLead(field, 48).get('b'), field.get('b'))
deep(fieldAtLead(new Map([['c', { rain24h: 1, rain7d: 2 }]]), 24).get('c'), {
  rain24h: 1,
  rain7d: 2,
})

// the peak is per component: the wettest 24 h and the wettest 7 d need not be
// the same node, and showing one node's pair would understate the other
deep(peakField(fieldAtLead(field, 0)), { rain24h: 30, rain7d: 40 })
deep(peakField(fieldAtLead(field, 24)), { rain24h: 55, rain7d: 120 })
deep(peakField(null), { rain24h: 0, rain7d: 0 })

eq(leadWindowEnd(field, 24), 'y')
eq(leadWindowEnd(field, 48), null)
eq(leadWindowEnd(null, 0), null)
eq(leadTruncated(field, 0), false)
eq(leadTruncated(field, 24), false, 'reported from the first node, which fits')
eq(leadTruncated(null, 0), false)

console.log(`openMeteo: all ${checks} assertions passed`)
