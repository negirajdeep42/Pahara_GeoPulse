/**
 * PAHARA risk engine.
 *
 * The central idea of the project:
 *
 *     risk = susceptibility x trigger
 *
 * `susceptibility` is static. It is precomputed offline from terrain (slope,
 * local relief, elevation, stream proximity) and shipped inside
 * risk_grid.geojson. It never changes in the browser.
 *
 * `trigger` is live. It is computed here, client-side, from rainfall - either
 * fetched from Open-Meteo or set by an operator running a what-if scenario.
 *
 * A terrain that cannot fail does not fail however hard it rains; rain that
 * never comes cannot fail even the worst terrain. Only the product is risk.
 */

export const RAIN24_MAX = 250 // slider range, mm
export const RAIN7D_MAX = 500 // slider range, mm

// Denominators that saturate each rainfall component.
export const INTENSITY_REF = 100 // mm in 24 h
export const ANTECEDENT_REF = 250 // mm in 7 d

export const WEIGHT_INTENSITY = 0.65
export const WEIGHT_ANTECEDENT = 0.35

export function clamp(value, min = 0, max = 1) {
  const n = Number(value)
  if (!Number.isFinite(n)) return min
  return Math.min(Math.max(n, min), max)
}

/** Normalised 24-hour burst component, 0-1. */
export function intensityOf(rain24h) {
  return Math.min((Number(rain24h) || 0) / INTENSITY_REF, 1)
}

/** Normalised 7-day wetness component, 0-1. */
export function antecedentOf(rain7d) {
  return Math.min((Number(rain7d) || 0) / ANTECEDENT_REF, 1)
}

/**
 * Rainfall trigger, 0-1.
 * Burst intensity dominates; antecedent moisture decides whether the ground
 * had any capacity left to absorb it.
 */
export function computeTrigger(rain24h, rain7d) {
  const intensity = intensityOf(rain24h)
  const antecedent = antecedentOf(rain7d)
  return clamp(WEIGHT_INTENSITY * intensity + WEIGHT_ANTECEDENT * antecedent, 0, 1)
}

/** The product at the heart of the model. */
export function computeRisk(susceptibility, trigger) {
  return clamp((Number(susceptibility) || 0) * (Number(trigger) || 0), 0, 1)
}

/** Operational band for a 0-1 risk value. */
export function riskClass(v) {
  const n = Number(v) || 0
  if (n < 0.25) return 'Safe'
  if (n < 0.5) return 'Watch'
  if (n < 0.7) return 'Warning'
  return 'Evacuate'
}

/** Both components plus the trigger, for panels that show the breakdown. */
export function triggerBreakdown(rain24h, rain7d) {
  const intensity = intensityOf(rain24h)
  const antecedent = antecedentOf(rain7d)
  return {
    intensity,
    antecedent,
    trigger: clamp(WEIGHT_INTENSITY * intensity + WEIGHT_ANTECEDENT * antecedent, 0, 1),
  }
}

/**
 * Ranks cells by live risk, highest first. Used by the priority list and by
 * the alert message builder.
 */
export function rankByRisk(cells, trigger, limit = 10) {
  return cells
    .map((c) => {
      const risk = computeRisk(c.susceptibility, trigger)
      return { ...c, risk, riskClass: riskClass(risk) }
    })
    .sort((a, b) => b.risk - a.risk || (b.population ?? 0) - (a.population ?? 0))
    .slice(0, limit)
}

/** How many cells sit in each operational band at a given trigger. */
export function countByClass(cells, trigger) {
  const counts = { Safe: 0, Watch: 0, Warning: 0, Evacuate: 0 }
  for (const c of cells) counts[riskClass(computeRisk(c.susceptibility, trigger))] += 1
  return counts
}
