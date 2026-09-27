// The plain-language layer.
//
// Everything the dashboard knows is already in `riskEngine.js`. This module
// adds no arithmetic and changes no number. It decides only WHICH WORDS a
// given cell should be described with, and returns i18n keys - never text - so
// the three locales stay the single source of wording.
//
// The vocabulary problem it solves: "susceptibility 0.72, trigger 0.61, risk
// 0.44, class Warning" is precise, defensible and useless to the person whose
// house is on that slope. The same cell in this module's terms is "Danger -
// be ready to move", because "this is a steep, landslide-prone slope and it
// has been raining hard".
//
// The technical figures are never destroyed, only demoted. The simple view
// keeps a disclosure that shows the multiplication, and the detailed view is
// one toggle away.

import { riskClass } from './riskEngine.js'

/**
 * Above this, a slope is described as one that can fail. Below it, the words
 * say the ground is not steep enough to slide easily.
 *
 * `suscept_class` is preferred when the grid carries it, because those bins
 * are quantiles of the actual modelled distribution and this constant is a
 * guess at the same boundary. The number is the fallback for a grid exported
 * without the label - the previous district file is one such.
 */
export const STEEP_SUSCEPT = 0.5
export const STEEP_CLASSES = ['High', 'Very High']

/** Above this trigger, the words say it has been raining hard. */
export const WET_TRIGGER = 0.4

/** Is this a slope the model thinks can fail? */
export function isSteep(cell) {
  if (cell?.suscept_class) return STEEP_CLASSES.includes(cell.suscept_class)
  return Number(cell?.susceptibility) >= STEEP_SUSCEPT
}

/** Has enough rain fallen to matter? */
export function isWet(cell) {
  return Number(cell?.trigger) >= WET_TRIGGER
}

/**
 * Which of four sentences explains this cell.
 *
 * These four are the whole model stated without a single technical word. A
 * reader who understands why a steep dry slope is not an emergency has
 * understood `risk = susceptibility x trigger`, which is the thing the
 * methodology modal takes four paragraphs to say.
 */
export function reasonKey(cell) {
  const steep = isSteep(cell)
  const wet = isWet(cell)
  if (steep && wet) return 'steepWet'
  if (steep && !wet) return 'steepDry'
  if (!steep && wet) return 'gentleWet'
  return 'gentleDry'
}

/**
 * How many action bullets each level carries. Kept here rather than counted
 * from the locale files so a translator who drops a line is caught by the
 * tests instead of silently shortening the advice.
 */
export const ACTION_COUNT = 3

/**
 * The full plain-language description of a cell: a headline, a reason, and
 * what to do about it.
 *
 * Returns keys into the `plain.*` namespace. The caller does the `t()`.
 */
export function adviceFor(cell) {
  const level = cell?.riskClass || riskClass(cell?.risk)
  return {
    level,
    headlineKey: `plain.level.${level}.headline`,
    summaryKey: `plain.level.${level}.summary`,
    reasonKey: `plain.reason.${reasonKey(cell)}`,
    actionKeys: Array.from({ length: ACTION_COUNT }, (_, i) => `plain.level.${level}.do${i + 1}`),
    // A non-colour cue for the verdict band. Red-amber-green alone fails for
    // roughly one man in twelve, and this view is the one being read by
    // someone who may be deciding whether to leave their house.
    shape: SHAPE[level],
    urgent: level === 'Warning' || level === 'Evacuate',
  }
}

/**
 * A glyph per level, so the four bands differ in form and not only in hue.
 * Deliberately the road-sign vocabulary rather than anything decorative.
 */
export const SHAPE = {
  Safe: 'check',
  Watch: 'eye',
  Warning: 'triangle',
  Evacuate: 'siren',
}

/**
 * The three verdicts `resolvePlace` can return, in plain-language terms.
 *
 * `unmonitored` is the one that matters. 1,350 of 5,196 settlements have no
 * modelled slope within range, because cells under 3 degrees are excluded and
 * those places sit on valley floor. In the operator dashboard that shows as a
 * grey panel and a distance. Here it must be unmistakable, because a resident
 * who reads "no data" as "safe" has been actively misled - the model has
 * nothing to say, which is a different statement from "you are fine".
 */
export function verdictTone(verdict) {
  if (verdict === 'ok') return 'answer'
  return 'nodata'
}
