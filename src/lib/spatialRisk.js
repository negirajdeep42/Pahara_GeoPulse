// Applies the rainfall field to the risk grid.
//
// The risk engine is unchanged and stays the single source of truth for the
// arithmetic: this module only decides WHICH rainfall each cell sees, then
// calls computeTrigger / computeRisk / riskClass exactly as before.
//
// Before the grid covered eight states there was one rainfall figure for the
// whole map, so the trigger was a scalar and the multiplication could live
// inside a MapLibre paint expression. Now each cell reads the 0.5 deg node it
// sits in, so the trigger varies across the map and the product is computed
// per cell here.

import { computeRisk, computeTrigger, riskClass } from './riskEngine.js'
import { nodeKeyFor } from './openMeteo.js'

/**
 * Attach rainfall, trigger, risk and risk class to every cell.
 *
 * `field` is the Map returned by fetchRainfallGrid, or null. When it is null -
 * the operator is running a what-if scenario on the sliders, or the fetch has
 * not happened yet - every cell falls back to the uniform figures, which is
 * exactly the old behaviour.
 */
export function scoreCells(cells, field, uniform) {
  const u24 = Number(uniform?.rain24h) || 0
  const u7d = Number(uniform?.rain7d) || 0
  const uniformTrigger = computeTrigger(u24, u7d)

  return cells.map((c) => {
    let rain24h = u24
    let rain7d = u7d
    let trigger = uniformTrigger
    let rain_source = 'uniform'

    if (field) {
      const hit = field.get(nodeKeyFor(c.lat, c.lon))
      if (hit) {
        rain24h = hit.rain24h
        rain7d = hit.rain7d
        trigger = computeTrigger(rain24h, rain7d)
        rain_source = 'grid'
      }
    }

    const risk = computeRisk(c.susceptibility, trigger)
    return { ...c, rain24h, rain7d, trigger, rain_source, risk, riskClass: riskClass(risk) }
  })
}

/**
 * Highest-risk cells first. Same ordering rule as rankByRisk in the risk
 * engine - risk, then population as the tie-break - but reading the per-cell
 * score already computed above instead of applying one scalar trigger.
 */
export function rankScored(scored, limit = 10) {
  return [...scored]
    .sort((a, b) => b.risk - a.risk || (b.population ?? 0) - (a.population ?? 0))
    .slice(0, limit)
}

/** How many cells sit in each operational band, using per-cell triggers. */
export function countScored(scored) {
  const counts = { Safe: 0, Watch: 0, Warning: 0, Evacuate: 0 }
  for (const c of scored) counts[c.riskClass] += 1
  return counts
}

/** Area-weighted mean trigger, for panels that still show one regional figure. */
export function meanTrigger(scored) {
  if (!scored.length) return 0
  let sum = 0
  for (const c of scored) sum += c.trigger
  return sum / scored.length
}

/**
 * The wettest node on the map right now, for the regional readout.
 *
 * The rainfall panel reads `peakField` in openMeteo.js instead, because it
 * needs the peak at a chosen forecast lead and scored cells only ever carry
 * one lead at a time. This stays as the equivalent for anything holding cells
 * rather than the raw field.
 */
export function peakRain(scored) {
  let rain24h = 0
  let rain7d = 0
  for (const c of scored) {
    if (c.rain24h > rain24h) rain24h = c.rain24h
    if (c.rain7d > rain7d) rain7d = c.rain7d
  }
  return { rain24h, rain7d }
}
