// Plain-language layer checks. Run: npm run test:advice
//
// Two things are worth asserting here and they are not the same thing.
//
// One: the mapping is total and stable. Every risk class produces a headline,
// a summary and exactly ACTION_COUNT actions; every combination of slope and
// rain produces one of four reasons. A missing key renders as the key itself,
// which on this screen would be `plain.level.Evacuate.do2` in front of someone
// deciding whether to leave their house.
//
// Two: the words agree with the model. The reason sentence claims something
// about the world - "steep, and raining hard" - and that claim has to follow
// from the same numbers the map was painted with, or the view is lying
// politely. The cross-check against the real grid at the bottom is the part
// that would catch a drifted threshold.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  ACTION_COUNT,
  SHAPE,
  STEEP_CLASSES,
  STEEP_SUSCEPT,
  WET_TRIGGER,
  adviceFor,
  isSteep,
  isWet,
  reasonKey,
  verdictTone,
} from './advice.js'
import { RISK_CLASSES } from './colors.js'
import { computeRisk, computeTrigger, riskClass } from './riskEngine.js'

import en from '../i18n/locales/en.json' with { type: 'json' }
import hi from '../i18n/locales/hi.json' with { type: 'json' }
import as from '../i18n/locales/as.json' with { type: 'json' }

let checks = 0
const ok = (cond, msg) => { assert.ok(cond, msg); checks += 1 }
const eq = (a, b, msg) => { assert.equal(a, b, msg); checks += 1 }

const LEVELS = RISK_CLASSES.map((c) => c.key)
const REASONS = ['steepWet', 'steepDry', 'gentleWet', 'gentleDry']

/** Walks a dotted key into a locale object. */
const lookup = (obj, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)

// --- the mapping is total ------------------------------------------------
for (const level of LEVELS) {
  const a = adviceFor({ riskClass: level, susceptibility: 0.6, trigger: 0.6 })
  eq(a.level, level, `${level} is carried through`)
  eq(a.actionKeys.length, ACTION_COUNT, `${level} has ${ACTION_COUNT} actions`)
  ok(SHAPE[level], `${level} has a non-colour glyph`)
  eq(a.shape, SHAPE[level])
  ok(a.headlineKey.startsWith('plain.level.'), `${level} headline is a plain key`)
}

// Warning and Evacuate are the two that should read as urgent; the other two
// must not, or the urgent styling means nothing.
eq(adviceFor({ riskClass: 'Safe' }).urgent, false)
eq(adviceFor({ riskClass: 'Watch' }).urgent, false)
eq(adviceFor({ riskClass: 'Warning' }).urgent, true)
eq(adviceFor({ riskClass: 'Evacuate' }).urgent, true)

// A cell that carries a raw risk but no class label still gets described,
// because `scoreCells` is not the only way a cell reaches this view.
eq(adviceFor({ risk: 0.8 }).level, 'Evacuate', 'the class is derived when absent')
eq(adviceFor({ risk: 0 }).level, 'Safe')
eq(adviceFor({}).level, 'Safe', 'an empty cell degrades to Safe, not to undefined')
eq(adviceFor(null).level, 'Safe', 'a missing cell does not throw')

// --- steep / wet classification -----------------------------------------
ok(isSteep({ suscept_class: 'Very High' }), 'Very High is steep')
ok(isSteep({ suscept_class: 'High' }))
ok(!isSteep({ suscept_class: 'Moderate' }), 'Moderate is not described as slide-prone')
ok(!isSteep({ suscept_class: 'Low' }))
ok(!isSteep({ suscept_class: 'Very Low' }))

// The label wins over the number when both are present: those bins are
// quantiles of the real distribution, the constant is a guess at the boundary.
ok(!isSteep({ suscept_class: 'Low', susceptibility: 0.99 }), 'the class label wins')
ok(isSteep({ suscept_class: 'High', susceptibility: 0.01 }))

// ...and the number is the fallback for a grid exported without the label -
// the previous district file is one such.
ok(isSteep({ susceptibility: STEEP_SUSCEPT }), 'the threshold itself counts as steep')
ok(!isSteep({ susceptibility: STEEP_SUSCEPT - 0.01 }))
ok(!isSteep({}), 'no susceptibility at all is not steep')
ok(!isSteep(null))

ok(isWet({ trigger: WET_TRIGGER }), 'the threshold itself counts as wet')
ok(!isWet({ trigger: WET_TRIGGER - 0.01 }))
ok(!isWet({}))
ok(!isWet(null))

// --- the four reasons, and they are genuinely four ----------------------
eq(reasonKey({ suscept_class: 'Very High', trigger: 0.9 }), 'steepWet')
eq(reasonKey({ suscept_class: 'Very High', trigger: 0.1 }), 'steepDry')
eq(reasonKey({ suscept_class: 'Low', trigger: 0.9 }), 'gentleWet')
eq(reasonKey({ suscept_class: 'Low', trigger: 0.1 }), 'gentleDry')

const seen = new Set()
for (const sus of [0.05, 0.3, 0.55, 0.95]) {
  for (const trig of [0, 0.2, 0.5, 0.95]) seen.add(reasonKey({ susceptibility: sus, trigger: trig }))
}
eq(seen.size, 4, 'all four reasons are reachable, none is dead copy')

// --- verdict tone -------------------------------------------------------
eq(verdictTone('ok'), 'answer')
eq(verdictTone('unmonitored'), 'nodata', 'no data is never dressed as an answer')
eq(verdictTone('outside'), 'nodata')

// --- every key the module can emit exists, in all three locales ---------
for (const [name, dict] of [['en', en], ['hi', hi], ['as', as]]) {
  for (const level of LEVELS) {
    const a = adviceFor({ riskClass: level })
    for (const key of [a.headlineKey, a.summaryKey, ...a.actionKeys]) {
      const text = lookup(dict, key)
      ok(typeof text === 'string' && text.length > 0, `${name}: ${key} exists`)
    }
  }
  for (const r of REASONS) {
    const text = lookup(dict, `plain.reason.${r}`)
    ok(typeof text === 'string' && text.length > 0, `${name}: plain.reason.${r} exists`)
  }
  // the interpolations the view actually passes
  ok(lookup(dict, 'plain.higherNear').includes('{{km}}'), `${name}: higherNear keeps {{km}}`)
  ok(lookup(dict, 'plain.higherNear').includes('{{dir}}'), `${name}: higherNear keeps {{dir}}`)
  ok(lookup(dict, 'plain.distantCell').includes('{{km}}'), `${name}: distantCell keeps {{km}}`)
  ok(lookup(dict, 'plain.nodataBody').includes('{{name}}'), `${name}: nodataBody keeps {{name}}`)
}

// The four headlines must differ from each other. Two levels sharing a
// sentence would be a translation bug that no type checker can see.
for (const [name, dict] of [['en', en], ['hi', hi], ['as', as]]) {
  const heads = LEVELS.map((l) => lookup(dict, `plain.level.${l}.headline`))
  eq(new Set(heads).size, LEVELS.length, `${name}: the four headlines are distinct`)
  const reasons = REASONS.map((r) => lookup(dict, `plain.reason.${r}`))
  eq(new Set(reasons).size, REASONS.length, `${name}: the four reasons are distinct`)
}

// --- the words agree with the model, on the real grid --------------------
const fc = JSON.parse(readFileSync('public/risk_grid.geojson', 'utf8'))
const cells = fc.features.map((f) => f.properties)

// A wet-season scenario, the same one the app opens with.
const trigger = computeTrigger(45, 120)
let steepWet = 0
let steepDry = 0
let gentle = 0

for (const c of cells) {
  const scored = {
    ...c,
    trigger,
    risk: computeRisk(c.susceptibility, trigger),
  }
  scored.riskClass = riskClass(scored.risk)
  const a = adviceFor(scored)
  const key = a.reasonKey.replace('plain.reason.', '')

  // the claim the sentence makes must follow from the numbers it was given
  if (key === 'steepWet' || key === 'steepDry') {
    ok(
      c.suscept_class ? STEEP_CLASSES.includes(c.suscept_class) : c.susceptibility >= STEEP_SUSCEPT,
      'a "slide-prone" sentence is only shown for a slide-prone cell',
    )
  }
  if (key === 'steepWet' || key === 'gentleWet') {
    ok(trigger >= WET_TRIGGER, 'a "raining hard" sentence is only shown when it is')
  }

  // nothing may be described as Safe while sitting in an urgent band
  if (a.level === 'Evacuate' || a.level === 'Warning') ok(a.urgent, 'urgent bands read as urgent')

  if (key === 'steepWet') steepWet += 1
  else if (key === 'steepDry') steepDry += 1
  else gentle += 1
}

ok(cells.length > 0, 'the real grid loaded')
ok(steepWet + steepDry + gentle === cells.length, 'every cell got exactly one reason')
console.log(
  `  ${cells.length} cells at trigger ${trigger.toFixed(2)}: ` +
    `${steepWet} steep+wet, ${steepDry} steep+dry, ${gentle} gentle`,
)

// In dry weather nothing may be described as raining hard, however steep.
const dry = cells.map((c) => ({ ...c, trigger: 0, risk: 0 }))
for (const c of dry) {
  const key = adviceFor(c).reasonKey
  ok(key.endsWith('Dry'), 'a dry region produces only dry sentences')
}

console.log(`advice: all ${checks} assertions passed`)
