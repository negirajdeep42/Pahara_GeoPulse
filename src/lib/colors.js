// Colour vocabulary for both map modes, plus the MapLibre paint expressions
// that turn cell properties into fill colours.
//
// The live-risk expression is the heart of the app: risk = susceptibility x
// trigger. Susceptibility is baked into every feature.
//
// There are two ways the trigger reaches the map, and both are here:
//
//   riskPaint(trigger)         one scalar for the whole region. Used for
//                              operator what-if scenarios, where a slider drag
//                              must recolour instantly - swapping a number
//                              inside the expression touches no features.
//   riskPaintSpatial(fallback) reads a per-cell risk from feature-state, set
//                              once when a live rainfall field arrives, and
//                              falls back to the scalar form until it does.

export const SUSCEPT_CLASSES = [
  { key: 'Very Low', color: '#2b83ba' },
  { key: 'Low', color: '#abdda4' },
  { key: 'Moderate', color: '#ffffbf' },
  { key: 'High', color: '#fdae61' },
  { key: 'Very High', color: '#d7191c' },
]

export const SUSCEPT_COLOR = Object.fromEntries(
  SUSCEPT_CLASSES.map((c) => [c.key, c.color]),
)

export const RISK_CLASSES = [
  { key: 'Safe', color: '#22c55e', from: 0, to: 0.25 },
  { key: 'Watch', color: '#eab308', from: 0.25, to: 0.5 },
  { key: 'Warning', color: '#f97316', from: 0.5, to: 0.7 },
  { key: 'Evacuate', color: '#dc2626', from: 0.7, to: 1 },
]

export const RISK_COLOR = Object.fromEntries(RISK_CLASSES.map((c) => [c.key, c.color]))

/** Tailwind-ish text colour for a risk class, for badges on dark panels. */
export const RISK_TEXT_ON = {
  Safe: '#052e16',
  Watch: '#1c1401',
  Warning: '#1f0d02',
  Evacuate: '#ffffff',
}

const NO_DATA = '#334155'

/**
 * Static susceptibility fill. Prefers the precomputed class label; falls back
 * to binning the raw 0-1 value so a grid exported without `suscept_class`
 * still renders.
 */
export function susceptibilityPaint() {
  return [
    'case',
    ['has', 'suscept_class'],
    [
      'match',
      ['to-string', ['get', 'suscept_class']],
      ...SUSCEPT_CLASSES.flatMap((c) => [c.key, c.color]),
      NO_DATA,
    ],
    [
      'step',
      ['to-number', ['coalesce', ['get', 'susceptibility'], 0]],
      SUSCEPT_CLASSES[0].color,
      0.2,
      SUSCEPT_CLASSES[1].color,
      0.4,
      SUSCEPT_CLASSES[2].color,
      0.6,
      SUSCEPT_CLASSES[3].color,
      0.8,
      SUSCEPT_CLASSES[4].color,
    ],
  ]
}

function riskSteps(value) {
  return [
    'step',
    value,
    RISK_CLASSES[0].color,
    RISK_CLASSES[1].from,
    RISK_CLASSES[1].color,
    RISK_CLASSES[2].from,
    RISK_CLASSES[2].color,
    RISK_CLASSES[3].from,
    RISK_CLASSES[3].color,
  ]
}

const UNIFORM_RISK = (t) => [
  '*',
  ['to-number', ['coalesce', ['get', 'susceptibility'], 0]],
  Number.isFinite(t) ? t : 0,
]

/**
 * Live risk fill for a single region-wide trigger (0-1). The multiplication
 * happens inside the style expression, which is why recolouring is instant.
 */
export function riskPaint(trigger) {
  return riskSteps(UNIFORM_RISK(trigger))
}

/**
 * Live risk fill when rainfall varies across the map. Each cell's risk is
 * pushed into feature-state when the rainfall field is fetched; cells the
 * field did not reach fall back to the uniform expression, so the map is
 * never blank while a fetch is in flight.
 */
export function riskPaintSpatial(fallbackTrigger) {
  return riskSteps([
    'coalesce',
    ['feature-state', 'risk'],
    UNIFORM_RISK(fallbackTrigger),
  ])
}
