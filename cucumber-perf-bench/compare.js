'use strict'

// Before/after comparison: runs the REAL functions from the pristine baseline
// build and the patched build head-to-head. Requires both builds to exist
// (preprocessor-src = baseline, preprocessor-patched = patched).

const path = require('node:path')
const fs = require('node:fs')
const { generate, stepPhrase } = require('./lib/generate')
const { makeConfig } = require('./lib/makeConfig')

const ROOT = process.env.BENCH_ROOT || path.join(__dirname, '..')
const BASE = path.join(ROOT, 'preprocessor-src', 'dist')
const PATCH = path.join(ROOT, 'preprocessor-patched', 'dist')

// XHR stub for the registry's inline-source-map lookup (browser API).
if (typeof global.XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = class { open () {} send () { this.readyState = 4; this.status = 404 } }
}

function load (dist) {
  return {
    dist,
    template: require(path.join(dist, 'template.js')),
    Registry: require(path.join(dist, 'registry.js')).Registry,
    getStepDefinitionPaths: require(path.join(dist, 'step-definitions.js')).getStepDefinitionPaths,
    createTests: require(path.join(dist, 'browser-runtime.js')).default,
    generateMessages: require(path.join(dist, '..', 'node_modules', '@cucumber', 'gherkin')).generateMessages,
    SourceMediaType: require(path.join(dist, '..', 'node_modules', '@cucumber', 'messages')).SourceMediaType,
    IdGenerator: require(path.join(dist, '..', 'node_modules', '@cucumber', 'messages')).IdGenerator,
  }
}

const fmtMs = (ms) => `${ms < 10 ? ms.toFixed(2) : ms.toFixed(0)} ms`
const fmtX = (b, i) => `${(b / i).toFixed(1)}x`
const silence = (fn) => { const w = console.warn; console.warn = () => {}; try { return fn() } finally { console.warn = w } }

// ---- glob discovery: N calls (one per feature) ----
async function benchGlob (mod, root, patterns, calls) {
  const t0 = performance.now()
  for (let i = 0; i < calls; i++) await mod.getStepDefinitionPaths(root, patterns)
  return performance.now() - t0
}

// ---- compile() per feature ----
async function benchCompile (mod, root, featurePaths) {
  const cfg = makeConfig(root, { tracking: false })
  const t0 = performance.now()
  for (const f of featurePaths) await mod.template.compile(cfg, fs.readFileSync(f, 'utf8'), f)
  return performance.now() - t0
}

// ---- registry resolveStepDefinition: K occurrences ----
function benchRegistry (mod, stepDefCount, occurrences, repeats = 5) {
  const reg = silence(() => {
    const r = new mod.Registry(false)
    for (let i = 0; i < stepDefCount; i++) r.defineStep(stepPhrase(i), () => {})
    let s = 0
    r.finalize(() => `id-${s++}`)
    return r
  })
  const texts = Array.from({ length: occurrences }, (_, i) => stepPhrase(i % stepDefCount))
  for (const t of texts) reg.resolveStepDefinition(t) // warm/prime
  let best = Infinity
  for (let r = 0; r < repeats; r++) {
    const t0 = performance.now()
    for (const t of texts) {
      const sd = reg.resolveStepDefinition(t)
      sd.expression.match(t).map((a) => a.getValue({}))
    }
    best = Math.min(best, performance.now() - t0)
  }
  return best
}

// ---- createTests load cost (#1) with stubbed Cypress/Mocha globals ----
function withStubs (fn) {
  const g = global
  const saved = {}
  const names = ['describe', 'it', 'before', 'beforeEach', 'after', 'afterEach', 'context', 'cy', 'Cypress']
  for (const n of names) saved[n] = g[n]

  const chain = new Proxy(function () {}, { get: () => chain, apply: () => chain })
  g.cy = chain
  g.Cypress = { env: () => ({}), config: () => false, log: () => chain, Chainable: function () {} }
  const describe = (name, opts, fn) => { (typeof opts === 'function' ? opts : fn)() }
  g.describe = describe
  g.context = describe
  g.it = () => {}
  g.before = () => {}
  g.beforeEach = () => {}
  g.after = () => {}
  g.afterEach = () => {}

  try { return fn() } finally { for (const n of names) g[n] = saved[n] }
}

function benchCreateTests (mod, root, feature, stepDefCount, repeats = 3) {
  const data = fs.readFileSync(feature, 'utf8')
  const envelopes = mod.generateMessages(data, path.relative(root, feature), mod.SourceMediaType.TEXT_X_CUCUMBER_GHERKIN_PLAIN, {
    includeSource: false, includeGherkinDocument: true, includePickles: true, newId: mod.IdGenerator.uuid(),
  })
  const gherkinDocument = envelopes.map((e) => e.gherkinDocument).find(Boolean)
  const pickles = envelopes.map((e) => e.pickle).filter(Boolean)
  const hints = { stepDefinitions: [], stepDefinitionPatterns: [], stepDefinitionPaths: [] }

  let best = Infinity
  for (let r = 0; r < repeats; r++) {
    // Fresh registry each iteration (createTests calls finalize()).
    const reg = silence(() => {
      const x = new mod.Registry(false)
      for (let i = 0; i < stepDefCount; i++) x.defineStep(stepPhrase(i), () => {})
      return x
    })
    const t0 = performance.now()
    withStubs(() => mod.createTests(reg, 1234, data, gherkinDocument, pickles, /* isTrackingState */ false, false, false, hints, false))
    best = Math.min(best, performance.now() - t0)
  }
  return best
}

async function main () {
  if (!fs.existsSync(PATCH)) {
    console.error(`Patched build not found at ${PATCH}. Build it first.`)
    process.exit(1)
  }
  const base = load(BASE)
  const patch = load(PATCH)

  const OPTS = {
    features: Number(process.env.FEATURES || 40),
    scenariosPerFeature: Number(process.env.SCENARIOS || 8),
    stepsPerScenario: Number(process.env.STEPS || 6),
    stepDefFiles: Number(process.env.STEPDEF_FILES || 40),
    stepsPerStepDefFile: Number(process.env.STEPS_PER_FILE || 12),
  }
  const stepDefCount = OPTS.stepDefFiles * OPTS.stepsPerStepDefFile
  const out = []
  const log = (s = '') => { out.push(s); console.log(s) }

  const root = path.join(__dirname, 'generated', 'compare')
  const g = generate(root, 'global', OPTS)
  const patterns = ['cypress/support/step_definitions/**/*.js']

  log('# Before/after: pristine vs patched preprocessor (real source)')
  log('')
  log(`Workload: ${OPTS.features} features x ${OPTS.scenariosPerFeature} scenarios x ${OPTS.stepsPerScenario} steps; ${stepDefCount} global step definitions; Node ${process.version}`)
  log('')

  // glob (#4)
  const gB = await benchGlob(base, root, patterns, OPTS.features)
  const gP = await benchGlob(patch, root, patterns, OPTS.features)
  // compile (benefits from #4)
  const cB = await benchCompile(base, root, g.featurePaths)
  const cP = await benchCompile(patch, root, g.featurePaths)
  // registry (#2)
  const occ = OPTS.features * OPTS.scenariosPerFeature * OPTS.stepsPerScenario
  const rB = benchRegistry(base, stepDefCount, occ)
  const rP = benchRegistry(patch, stepDefCount, occ)
  // createTests load cost (#1) on the largest feature
  let eB, eP, eNote = ''
  try {
    eB = benchCreateTests(base, root, g.featurePaths[0], stepDefCount)
    eP = benchCreateTests(patch, root, g.featurePaths[0], stepDefCount)
  } catch (e) { eNote = e.message.split('\n')[0] }

  log('| path | metric | baseline | patched | speedup |')
  log('|---|---|---:|---:|---:|')
  log(`| #4 glob memo | ${OPTS.features} discovery calls | ${fmtMs(gB)} | ${fmtMs(gP)} | ${fmtX(gB, gP)} |`)
  log(`| #4 (via compile) | compile ${OPTS.features} features | ${fmtMs(cB)} | ${fmtMs(cP)} | ${fmtX(cB, cP)} |`)
  log(`| #2 match cache | resolve ${occ} steps (${stepDefCount} defs) | ${fmtMs(rB)} | ${fmtMs(rP)} | ${fmtX(rB, rP)} |`)
  if (eB) {
    log(`| #1 lazy matching | createTests load, tracking off | ${fmtMs(eB)} | ${fmtMs(eP)} | ${fmtX(eB, eP)} |`)
  } else {
    log(`| #1 lazy matching | createTests load | n/a | n/a | skipped: ${eNote} |`)
  }
  log('')
  log('> #3 (step-hook fast path) eliminates per-step filter/sort/reverse when no step hooks are defined; it affects the in-test execution loop and is not exercised by these load/bundle benchmarks.')

  fs.writeFileSync(path.join(__dirname, 'COMPARE.md'), out.join('\n'))
  console.log('\nWrote COMPARE.md')
}

main().catch((e) => { console.error(e); process.exit(1) })
