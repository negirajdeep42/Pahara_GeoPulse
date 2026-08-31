// Guards the promise the cell inspector makes: it renders whatever a grid file
// happens to carry and never throws on a property that is not there.
//
// Two real files with different schemas are exercised when they are present -
// the Northeast grid (state/district, TPI, roughness, curvature, aspect as
// sin/cos) and the older Dima Hasao district grid (stream and road distance,
// raw aspect degrees) - plus a set of deliberately hostile synthetic cells.
//
// Run: node src/lib/factors.test.mjs

import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { aspectOf, exposureFactors, terrainFactors, triggerFactors } from './factors.js'
import { scoreCells } from './spatialRisk.js'
import { buildRainfallNodes, nodeKeyFor } from './openMeteo.js'

let checks = 0
const ok = (cond, msg) => {
  assert.ok(cond, msg)
  checks += 1
}

/** Every bar must be renderable: a label key, and either a number or a null. */
function assertRenderable(bars, where) {
  for (const b of bars) {
    ok(typeof b.key === 'string' && b.key.length > 0, `${where}: bar has a label key`)
    ok(b.value === null || Number.isFinite(b.value), `${where}: ${b.key} value is a number or null`)
    ok(
      b.norm === null || (Number.isFinite(b.norm) && b.norm >= 0 && b.norm <= 1),
      `${where}: ${b.key} norm is null or within 0..1`,
    )
  }
}

// ---------------------------------------------------------------- synthetic
const HOSTILE = [
  ['empty object', {}],
  ['all nulls', { slope_deg: null, elevation_m: null, relief_m: null, aspect_deg: null }],
  ['strings', { slope_deg: '31.4', elevation_m: 'n/a', relief_m: '' }],
  ['NaN and Infinity', { slope_deg: NaN, elevation_m: Infinity, tpi_m: -Infinity }],
  ['undefined fields', { slope_deg: undefined, curvature: undefined }],
  ['out of range', { slope_deg: 900, elevation_m: -500, relief_m: 1e9 }],
]

for (const [name, cell] of HOSTILE) {
  assertRenderable(terrainFactors(cell), `hostile/${name}`)
  assertRenderable(exposureFactors(cell), `hostile/${name}`)
  const a = aspectOf(cell)
  ok(a === null || (a.deg >= 0 && a.deg < 360), `hostile/${name}: aspect is null or 0..360`)
}

// a features list naming predictors the cell does not have must not invent bars
const claimed = ['slope_deg', 'tpi_m', 'roughness_m', 'not_a_real_feature', 'aspect_sin']
const sparse = terrainFactors({ slope_deg: 22 }, claimed)
ok(sparse.length === 1, 'features the cell lacks produce no bar')
ok(sparse[0].key === 'slope', 'the one present feature still renders')
assertRenderable(sparse, 'sparse')

// aspect from sin/cos must round-trip
const back = aspectOf({ aspect_sin: Math.sin(Math.PI / 2), aspect_cos: Math.cos(Math.PI / 2) })
ok(Math.abs(back.deg - 90) < 1e-6, 'aspect reconstructs from sin/cos')
ok(back.compass === 'E', 'aspect 90 deg reads as East')
ok(aspectOf({ aspect_deg: 359.6 }).compass === 'N', 'aspect wraps past 360 to North')

// importance ordering
const ordered = terrainFactors(
  { slope_deg: 30, elevation_m: 900, relief_m: 400 },
  ['slope_deg', 'elevation_m', 'relief_m'],
  { slope_deg: 0.1, elevation_m: 0.7, relief_m: 0.2 },
)
ok(ordered[0].property === 'elevation_m', 'bars sort by model importance')

// trigger bars survive junk rainfall
assertRenderable(triggerFactors(null, undefined), 'trigger/null')
assertRenderable(triggerFactors('45', 120), 'trigger/string')

// ------------------------------------------------------------- rainfall map
const cells = [
  { cell_id: 'a', lat: 25.02, lon: 93.02, susceptibility: 0.8 },
  { cell_id: 'b', lat: 25.48, lon: 93.48, susceptibility: 0.5 },
  { cell_id: 'c', lat: 27.3, lon: 95.1, susceptibility: 0.2 },
]
const nodes = buildRainfallNodes(cells)
ok(nodes.length === 2, 'cells inside one 0.5 deg box share a rainfall node')
for (const c of cells) {
  ok(
    nodes.some((n) => n.key === nodeKeyFor(c.lat, c.lon)),
    `every cell resolves to a fetched node (${c.cell_id})`,
  )
}

const field = new Map([[nodes[0].key, { rain24h: 90, rain7d: 300 }]])
const scored = scoreCells(cells, field, { rain24h: 10, rain7d: 20 })
ok(scored[0].rain_source === 'grid', 'a covered cell reads the node')
ok(scored[2].rain_source === 'uniform', 'an uncovered cell falls back to the scenario')
ok(scored[0].trigger > scored[2].trigger, 'the wet node produces a higher trigger')
for (const c of scored) {
  ok(c.risk >= 0 && c.risk <= 1, 'risk stays within 0..1')
  ok(typeof c.riskClass === 'string', 'every cell gets a risk class')
}
// with no field at all, every cell must still score
const uniformOnly = scoreCells(cells, null, { rain24h: 45, rain7d: 120 })
ok(new Set(uniformOnly.map((c) => c.trigger)).size === 1, 'no field means one shared trigger')

// --------------------------------------------------------------- real files
for (const [label, path] of [
  ['northeast', 'public/risk_grid.geojson'],
  ['dima hasao', 'public/risk_grid_dimahasao.geojson'],
]) {
  if (!existsSync(path)) {
    console.log(`  (skipped ${label}: ${path} not present)`)
    continue
  }
  const fc = JSON.parse(readFileSync(path, 'utf8'))
  const features = fc.metadata?.features ?? null
  const importance = fc.metadata?.feature_importance ?? null
  const sample = fc.features.filter((_, i) => i % 97 === 0).slice(0, 400)

  for (const f of sample) {
    const p = f.properties || {}
    assertRenderable(terrainFactors(p, features, importance), `${label}/terrain`)
    assertRenderable(exposureFactors(p), `${label}/exposure`)
    const a = aspectOf(p)
    ok(a === null || (a.deg >= 0 && a.deg < 360), `${label}: aspect sane`)
  }

  const props = sample.map((f, i) => ({
    ...f.properties,
    cell_id: f.properties?.cell_id ?? `C${i}`,
    lat: Number(f.properties?.lat),
    lon: Number(f.properties?.lon),
    susceptibility: Number(f.properties?.susceptibility) || 0,
  }))
  const s = scoreCells(props, null, { rain24h: 45, rain7d: 120 })
  ok(s.every((c) => Number.isFinite(c.risk)), `${label}: every cell scores to a finite risk`)
  console.log(
    `  ${label}: ${fc.features.length} features, ` +
      `${features ? features.length + ' model features' : 'no metadata.features'}, ` +
      `${sample.length} sampled`,
  )
}

console.log(`factors/spatialRisk: all ${checks} assertions passed`)
