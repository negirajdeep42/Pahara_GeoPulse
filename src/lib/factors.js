// Turns a cell's raw properties into the bars shown under "Why this rating".
//
// Which bars appear is decided by the grid file, not by this module. The
// metadata block lists the features the model was actually trained on, so a
// grid exported with a different predictor set renders a different breakdown
// and nothing has to change here. Anything the file does not carry is simply
// absent - no bar is invented, and a missing property never throws.
//
// Each bar carries both the real measured value (what the operator needs) and
// a 0-1 normalisation (what the bar length shows). Reference maxima are
// working ranges for Northeast India, so a bar means the same thing on every
// cell and between sessions.

import { antecedentOf, intensityOf } from './riskEngine.js'

/**
 * Per-feature display rules.
 *
 *   ref      value at which the bar is full
 *   unit     i18n units key
 *   invert   true when *small* is dangerous, so the bar shows proximity
 *   signed   true for values that swing either side of zero
 */
export const FEATURE_SPECS = {
  slope_deg: { labelKey: 'slope', unit: 'deg', ref: 45, digits: 1 },
  slope_mean_deg: { labelKey: 'slopeMean', unit: 'deg', ref: 45, digits: 1 },
  relief_m: { labelKey: 'relief', unit: 'm', ref: 1200, digits: 0 },
  elevation_m: { labelKey: 'elevation', unit: 'm', ref: 3000, digits: 0 },
  roughness_m: { labelKey: 'roughness', unit: 'm', ref: 250, digits: 0 },
  tpi_m: { labelKey: 'tpi', unit: 'm', ref: 200, digits: 0, signed: true },
  curvature: { labelKey: 'curvature', unit: null, ref: 0.5, digits: 3, signed: true },
  // legacy Dima Hasao predictors - kept so the old district grid still renders
  dist_stream_m: { labelKey: 'stream', unit: 'm', ref: 2000, digits: 0, invert: true },
  dist_road_m: { labelKey: 'road', unit: 'm', ref: 5000, digits: 0 },
}

/** Features that are real predictors but meaningless as a magnitude bar. */
const NON_BAR = new Set(['aspect_sin', 'aspect_cos'])

/** Kept for the older grid: reference maxima by property name. */
export const REF = Object.fromEntries(
  Object.entries(FEATURE_SPECS).map(([k, v]) => [k, v.ref]),
)

const clamp01 = (v) => Math.min(Math.max(v, 0), 1)

function bar(key, value, unit, norm, extra = {}) {
  const missing = value === null || value === undefined || !Number.isFinite(Number(value))
  return {
    key,
    value: missing ? null : Number(value),
    unit,
    norm: missing ? null : clamp01(norm),
    ...extra,
  }
}

function normalise(spec, value) {
  const v = Number(value)
  if (spec.invert) return 1 - v / spec.ref
  if (spec.signed) return Math.abs(v) / spec.ref
  return v / spec.ref
}

/**
 * Static terrain drivers, in the order the model found them important.
 *
 * @param cell      the clicked cell's properties
 * @param features  metadata.features - the predictor list from the grid file
 * @param importance metadata.feature_importance, used only for ordering
 */
export function terrainFactors(cell = {}, features = null, importance = null) {
  const list = Array.isArray(features) && features.length
    ? features
    : // no metadata: fall back to whatever known predictors the cell carries
      Object.keys(FEATURE_SPECS).filter((k) => cell[k] !== undefined && cell[k] !== null)

  const bars = list
    .filter((k) => !NON_BAR.has(k))
    .filter((k) => FEATURE_SPECS[k])
    .filter((k) => cell[k] !== undefined)
    .map((k) => {
      const spec = FEATURE_SPECS[k]
      return bar(spec.labelKey, cell[k], spec.unit, normalise(spec, cell[k]), {
        property: k,
        digits: spec.digits,
        importance: Number(importance?.[k]) || null,
      })
    })

  if (importance) {
    bars.sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0))
  }
  return bars
}

/**
 * Aspect, reconstructed from its sin/cos encoding when that is how the grid
 * stores it. Returned separately from the bars: a compass direction is a
 * direction, not a magnitude, and a bar would misrepresent it.
 */
export function aspectOf(cell = {}) {
  let deg = null
  if (Number.isFinite(Number(cell.aspect_deg))) {
    deg = Number(cell.aspect_deg)
  } else if (
    Number.isFinite(Number(cell.aspect_sin)) &&
    Number.isFinite(Number(cell.aspect_cos))
  ) {
    deg = (Math.atan2(Number(cell.aspect_sin), Number(cell.aspect_cos)) * 180) / Math.PI
  }
  if (deg === null) return null
  const norm = ((deg % 360) + 360) % 360
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return { deg: norm, compass: points[Math.round(norm / 45) % 8] }
}

/** Live rainfall drivers - the trigger half of the model. */
export function triggerFactors(rain24h, rain7d) {
  return [
    bar('intensity', rain24h, 'mm', intensityOf(rain24h), { digits: 0 }),
    bar('antecedent', rain7d, 'mm', antecedentOf(rain7d), { digits: 0 }),
  ]
}

/**
 * Context that does not feed the score but matters when acting on it.
 * Only ever returns bars for properties the cell actually has.
 */
export function exposureFactors(cell = {}) {
  const out = []
  if (cell.dist_road_m !== undefined && cell.dist_road_m !== null) {
    const spec = FEATURE_SPECS.dist_road_m
    out.push(
      bar('road', cell.dist_road_m, spec.unit, normalise(spec, cell.dist_road_m), {
        property: 'dist_road_m',
        digits: 0,
      }),
    )
  }
  if (cell.dist_village_km !== undefined && cell.dist_village_km !== null) {
    out.push(
      bar('village_distance', cell.dist_village_km, 'km', 1 - Number(cell.dist_village_km) / 20, {
        property: 'dist_village_km',
        digits: 1,
      }),
    )
  }
  return out
}
