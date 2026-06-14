'use strict'

// Bench C — verifies improvement #2: cache step-definition matching by step text.
//
// Uses the REAL Registry + @cucumber/cucumber-expressions matching. Baseline
// re-scans all M step definitions (calling expression.match on each) for every
// step occurrence — exactly what getMatchingStepDefinitions/resolveStepDefinition
// do at BOTH load time (pickleStepToTestStep) and run time. The improved variant
// memoizes the resolution + extracted args by step text.

// The registry's defineStep does an inline-source-map lookup via synchronous
// XMLHttpRequest (a browser API). Stub it so the lookup fails gracefully in Node
// — irrelevant to matching cost, which is what we measure.
if (typeof global.XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = class {
    open () {}
    send () { this.readyState = 4; this.status = 404 }
  }
}

const { registry: registryMod } = require('../lib/preproc')
const { Registry } = registryMod
const { stepPhrase } = require('../lib/generate')

function buildRegistry (M) {
  const reg = new Registry(false)
  for (let i = 0; i < M; i++) {
    reg.defineStep(stepPhrase(i), () => {})
  }
  let seq = 0
  reg.finalize(() => `id-${seq++}`)
  return reg
}

// Mirrors what the runtime does today, per step: resolve (full scan) + a second
// match on the winner to extract args (registry.runStepDefinition).
function baselineResolveAndExtract (reg, text) {
  const sd = reg.resolveStepDefinition(text) // full scan via getMatchingStepDefinitions
  const args = sd.expression.match(text).map((a) => a.getValue({}))
  return { sd, args }
}

function makeCachedResolver (reg) {
  const cache = new Map()
  return (text) => {
    let hit = cache.get(text)
    if (hit) return hit
    const sd = reg.resolveStepDefinition(text)
    const args = sd.expression.match(text).map((a) => a.getValue({}))
    hit = { sd, args }
    cache.set(text, hit)
    return hit
  }
}

function run ({ stepDefCount, uniqueSteps, totalOccurrences, repeats = 5 }) {
  const origWarn = console.warn
  console.warn = () => {}
  const reg = buildRegistry(stepDefCount)
  console.warn = origWarn

  // Build the workload: `totalOccurrences` steps drawn from `uniqueSteps`
  // distinct phrases (steps repeat across scenarios -> cache pays off).
  const texts = []
  for (let i = 0; i < totalOccurrences; i++) {
    texts.push(stepPhrase(i % uniqueSteps))
  }

  // warmup
  for (const t of texts) baselineResolveAndExtract(reg, t)

  let baseline = Infinity
  for (let r = 0; r < repeats; r++) {
    const t0 = performance.now()
    for (const t of texts) baselineResolveAndExtract(reg, t)
    baseline = Math.min(baseline, performance.now() - t0)
  }

  const cached = makeCachedResolver(reg)
  for (const t of texts) cached(t) // warm + prime cache
  let improved = Infinity
  for (let r = 0; r < repeats; r++) {
    const t1 = performance.now()
    for (const t of texts) cached(t)
    improved = Math.min(improved, performance.now() - t1)
  }

  return { baseline, improved, stepDefCount, uniqueSteps, totalOccurrences }
}

module.exports = { run, buildRegistry, baselineResolveAndExtract }
