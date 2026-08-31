// Plain-node checks for the risk engine. Run: npm run test:engine
import assert from 'node:assert/strict'
import {
  clamp,
  computeRisk,
  computeTrigger,
  countByClass,
  rankByRisk,
  riskClass,
  triggerBreakdown,
} from './riskEngine.js'

const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps

// --- computeTrigger -------------------------------------------------------
assert.ok(near(computeTrigger(0, 0), 0), 'dry weather triggers nothing')
assert.ok(near(computeTrigger(100, 250), 1), 'both components saturate at 1')
assert.ok(near(computeTrigger(50, 125), 0.5), 'half of each gives half a trigger')
assert.ok(near(computeTrigger(100, 0), 0.65), 'intensity carries 0.65')
assert.ok(near(computeTrigger(0, 250), 0.35), 'antecedent carries 0.35')
assert.ok(near(computeTrigger(9999, 9999), 1), 'components cap before weighting')
assert.ok(near(computeTrigger(-50, -50), 0), 'negative input floors at 0')
assert.ok(near(computeTrigger(undefined, null), 0), 'missing input is treated as dry')

// --- computeRisk ----------------------------------------------------------
assert.ok(near(computeRisk(0.8, 0.5), 0.4), 'risk is the product')
assert.ok(near(computeRisk(1, 0), 0), 'no trigger, no risk - however bad the slope')
assert.ok(near(computeRisk(0, 1), 0), 'no susceptibility, no risk - however hard it rains')
assert.ok(near(computeRisk(2, 2), 1), 'result is clamped to 1')

// --- riskClass boundaries -------------------------------------------------
assert.equal(riskClass(0), 'Safe')
assert.equal(riskClass(0.2499), 'Safe')
assert.equal(riskClass(0.25), 'Watch')
assert.equal(riskClass(0.4999), 'Watch')
assert.equal(riskClass(0.5), 'Warning')
assert.equal(riskClass(0.6999), 'Warning')
assert.equal(riskClass(0.7), 'Evacuate')
assert.equal(riskClass(1), 'Evacuate')

// --- clamp ----------------------------------------------------------------
assert.equal(clamp(5), 1)
assert.equal(clamp(-5), 0)
assert.equal(clamp(NaN), 0)

// --- breakdown ------------------------------------------------------------
const b = triggerBreakdown(50, 125)
assert.ok(near(b.intensity, 0.5) && near(b.antecedent, 0.5) && near(b.trigger, 0.5))

// --- ranking and counting -------------------------------------------------
const cells = [
  { cell_id: 'a', susceptibility: 0.9, population: 100 },
  { cell_id: 'b', susceptibility: 0.2, population: 900 },
  { cell_id: 'c', susceptibility: 0.75, population: 500 },
]
const ranked = rankByRisk(cells, 1, 2)
assert.deepEqual(
  ranked.map((c) => c.cell_id),
  ['a', 'c'],
  'ranking is by risk, descending',
)
assert.equal(ranked[0].riskClass, 'Evacuate')

const counts = countByClass(cells, 1)
assert.deepEqual(counts, { Safe: 1, Watch: 0, Warning: 0, Evacuate: 2 })
assert.deepEqual(countByClass(cells, 0), { Safe: 3, Watch: 0, Warning: 0, Evacuate: 0 })

console.log('riskEngine: all assertions passed')
