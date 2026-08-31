// Checks the search against the real places.json and the real grid, because
// the interesting failures are all data-shaped: romanisation variants, names
// that repeat across states, and settlements that are inside the region but
// have no modelled slope near them.
//
// Run: node src/lib/placeSearch.test.mjs

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import {
  BBOX,
  FUSE_OPTIONS,
  SUGGESTIONS,
  buildIndex,
  insideRegion,
  resolvePlace,
  searchPlaces,
} from './placeSearch.js'
import { haversineKm, bearing, nearestCell, nearestHigherRisk } from './geo.js'
import { scoreCells } from './spatialRisk.js'

let checks = 0
const ok = (cond, msg) => {
  assert.ok(cond, msg)
  checks += 1
}

const PLACES = 'public/places.json'
const GRID = 'public/risk_grid.geojson'
if (!existsSync(PLACES) || !existsSync(GRID)) {
  console.log('  (skipped: public/places.json or public/risk_grid.geojson missing)')
  process.exit(0)
}

const raw = JSON.parse(readFileSync(PLACES, 'utf8'))
const places = (Array.isArray(raw) ? raw : raw.places).map((p, i) => ({ ...p, id: `p${i}` }))
const fc = JSON.parse(readFileSync(GRID, 'utf8'))
const cells = fc.features.map((f) => ({
  ...f.properties,
  lat: Number(f.properties.lat),
  lon: Number(f.properties.lon),
  susceptibility: Number(f.properties.susceptibility) || 0,
}))
const scored = scoreCells(cells, null, { rain24h: 60, rain7d: 200 })
console.log(`  ${places.length} places, ${scored.length} cells`)

// ------------------------------------------------------------------- geo
ok(Math.abs(haversineKm(26, 92, 26, 92)) < 1e-9, 'zero distance to self')
ok(Math.abs(haversineKm(25, 93, 26, 93) - 111.19) < 0.5, 'one degree of latitude is ~111 km')
ok(bearing(25, 93, 26, 93).compass === 'N', 'due north reads N')
ok(bearing(25, 93, 25, 94).compass === 'E', 'due east reads E')
ok(bearing(25, 93, 24, 92).compass === 'SW', 'down-left reads SW')

// the latitude gate in nearestCell must not change the answer
{
  const brute = (lat, lon) =>
    scored.reduce((b, c) => {
      const km = haversineKm(lat, lon, c.lat, c.lon)
      return !b || km < b.km ? { cell: c, km } : b
    }, null)
  for (const [lat, lon] of [[25.6, 93.2], [27.4, 95.6], [22.1, 92.0], [29.0, 95.0]]) {
    const fast = nearestCell(scored, lat, lon)
    const slow = brute(lat, lon)
    ok(Math.abs(fast.km - slow.km) < 1e-9, `nearestCell matches brute force at ${lat},${lon}`)
  }
}

// ---------------------------------------------------------------- fuzzy
const fuse = buildIndex(places)
ok(FUSE_OPTIONS.threshold === 0.35, 'threshold is 0.35')
ok(FUSE_OPTIONS.ignoreLocation === true, 'ignoreLocation is on')
ok(FUSE_OPTIONS.minMatchCharLength === 2, 'minMatchCharLength is 2')

// Romanisation variants a live demo will actually hit. Measured against the
// real file at threshold 0.35: 23 of 27 tried variants match.
//
// Known misses, all two or three edits on a short name: Aizol, Silong, Imfal,
// and - worth knowing - Gauhati, the historical official spelling of Guwahati.
// Loosening the threshold to catch them costs precision everywhere else, so
// the threshold stays where it was specified and this is documented instead.
for (const [typed, expected] of [
  ['Aizawl', 'Aizawl'],
  ['Aizwal', 'Aizawl'],
  ['Aizawal', 'Aizawl'],
  ['Aiziwal', 'Aizawl'],
  ['Shillong', 'Shillong'],
  ['Shilong', 'Shillong'],
  ['Shilliong', 'Shillong'],
  ['Kohima', 'Kohima'],
  ['Kohema', 'Kohima'],
  ['Kohuma', 'Kohima'],
  ['Itanagar', 'Itanagar'],
  ['Itanagr', 'Itanagar'],
  ['Itnagar', 'Itanagar'],
  ['Guwahati', 'Guwahati'],
  ['Guwahoti', 'Guwahati'],
  ['Guahati', 'Guwahati'],
  ['Imphal', 'Imphal'],
  ['Dimapore', 'Dimapur'],
  ['Gangtak', 'Gangtok'],
  ['Agartola', 'Agartala'],
]) {
  const hits = searchPlaces(fuse, typed, 8)
  ok(hits.some((h) => h.name === expected), `"${typed}" finds ${expected}`)
}

// a settlement match must outrank a district match on the same word
{
  const hits = searchPlaces(fuse, 'Aizawl', 8)
  ok(hits.length > 0 && hits[0].name === 'Aizawl', 'name beats district for Aizawl')
}

// every suggestion chip must resolve, or a judge clicks a dead button
for (const name of SUGGESTIONS) {
  const hits = searchPlaces(fuse, name, 5)
  ok(hits.some((h) => h.name === name), `suggestion chip "${name}" resolves`)
}

// short and empty queries return nothing rather than everything
ok(searchPlaces(fuse, '', 8).length === 0, 'empty query returns nothing')
ok(searchPlaces(fuse, 'a', 8).length === 0, 'one character returns nothing')
ok(searchPlaces(fuse, 'zzzzqqqq', 8).length === 0, 'nonsense returns nothing')
ok(searchPlaces(fuse, 'Aizawl', 8).length <= 8, 'result count is capped at 8')

// ------------------------------------------------------------- resolution
ok(insideRegion(25.8, 93.0), 'centre of the region is inside')
ok(!insideRegion(28.6, 77.2), 'Delhi is outside')
ok(!insideRegion(NaN, 93), 'NaN is outside')

// Delhi: a real place, plainly outside the monitored area
ok(
  resolvePlace({ name: 'Delhi', lat: 28.61, lon: 77.21 }, scored).verdict === 'outside',
  'a place outside the bbox reports "outside"',
)

// Guwahati: inside the region, but sat on flat valley floor. This must not be
// reported as an assessment of Guwahati itself.
{
  const g = places.find((p) => p.name === 'Guwahati')
  ok(g, 'Guwahati is in places.json')
  ok(g.susceptibility === null, 'Guwahati has no susceptibility - flat valley')
  const r = resolvePlace(g, scored)
  ok(r.verdict !== 'outside', 'Guwahati is not reported as outside the region')
  ok(
    r.verdict === 'unmonitored' || (r.verdict === 'ok' && r.distant),
    'Guwahati is flagged as unmonitored or as a distant stand-in cell, never as a plain reading',
  )
}

// a hill town should resolve to a cell essentially on top of it
{
  const a = places.find((p) => p.name === 'Aizawl')
  const r = resolvePlace(a, scored)
  ok(r.verdict === 'ok', 'Aizawl resolves to a real cell')
  ok(r.km < 5, `Aizawl's cell is close (${r.km.toFixed(1)} km)`)
  ok(!r.distant, 'Aizawl is not flagged as distant')
  ok(r.cell.risk >= 0 && r.cell.risk <= 1, 'risk within 0..1')
  ok(typeof r.cell.riskClass === 'string', 'risk class present')
}

// every settlement must resolve to one of the three verdicts without throwing
{
  const counts = { ok: 0, outside: 0, unmonitored: 0 }
  let distant = 0
  for (const p of places) {
    const r = resolvePlace(p, scored)
    ok(['ok', 'outside', 'unmonitored'].includes(r.verdict), `verdict valid for ${p.name}`)
    counts[r.verdict] += 1
    if (r.verdict === 'ok' && r.distant) distant += 1
    if (r.verdict === 'ok') {
      ok(Number.isFinite(r.cell.risk), `finite risk for ${p.name}`)
    }
  }
  console.log(
    `  verdicts: ${counts.ok} ok (${distant} via a distant cell), ` +
      `${counts.unmonitored} unmonitored, ${counts.outside} outside`,
  )
  ok(counts.ok > 1000, 'most settlements get a real assessment')
}

// hostile input must not throw
for (const bad of [
  null,
  {},
  { lat: 'x', lon: 'y' },
  { lat: NaN, lon: NaN },
  { lat: 999, lon: 999 },
  { name: 'nowhere' },
]) {
  const r = resolvePlace(bad, scored)
  ok(r && typeof r.verdict === 'string', 'hostile point still yields a verdict')
}
ok(resolvePlace({ lat: 25.8, lon: 93 }, []).verdict === 'unmonitored', 'empty grid is unmonitored')

// ------------------------------------------------------- higher-risk hint
{
  let found = 0
  for (const p of places.slice(0, 400)) {
    const r = resolvePlace(p, scored)
    if (r.verdict !== 'ok' || !r.higher) continue
    found += 1
    ok(r.higher.km <= 10.0001, 'the higher-risk hint stays within 10 km')
    ok(r.higher.cell.risk > r.cell.risk, 'the hinted cell really is higher risk')
    ok(/^(N|NE|E|SE|S|SW|W|NW)$/.test(r.higher.compass), 'bearing is an 8-point compass label')
  }
  ok(found > 0, `the higher-risk hint fires for real places (${found} of the first 400)`)
}
ok(
  nearestHigherRisk(scored, 25.8, 93.0, 1.0, 10) === null,
  'nothing outranks a risk of 1.0',
)

console.log(`placeSearch: all ${checks} assertions passed`)
