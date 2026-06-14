'use strict'

const path = require('node:path')
const fs = require('node:fs')
const { generate } = require('./lib/generate')
const benchBundle = require('./bench/bundle')
const benchGlob = require('./bench/glob')
const benchRegistry = require('./bench/registry')
const benchPayload = require('./bench/payload')

const N = (k, d) => (process.env[k] ? Number(process.env[k]) : d)

const OPTS = {
  features: N('FEATURES', 30),
  scenariosPerFeature: N('SCENARIOS', 5),
  stepsPerScenario: N('STEPS', 5),
  stepDefFiles: N('STEPDEF_FILES', 20),
  stepsPerStepDefFile: N('STEPS_PER_FILE', 10),
}
const WEBPACK_SUBSET = N('WEBPACK_SUBSET', 6)

const fmtMs = (ms) => `${ms < 10 ? ms.toFixed(2) : ms.toFixed(0)} ms`
const fmtKb = (b) => `${(b / 1024).toFixed(1)} KiB`
const fmtX = (base, imp) => `${(base / imp).toFixed(1)}x`

async function main () {
  const out = []
  const log = (s = '') => { out.push(s); console.log(s) }

  log(`# cypress-cucumber-preprocessor performance benchmark`)
  log('')
  log(`Preprocessor: @badeball/cypress-cucumber-preprocessor (built from source clone)`)
  log(`Workload: ${OPTS.features} features x ${OPTS.scenariosPerFeature} scenarios x ${OPTS.stepsPerScenario} steps`)
  log(`Global step universe: ${OPTS.stepDefFiles} files x ${OPTS.stepsPerStepDefFile} steps = ${OPTS.stepDefFiles * OPTS.stepsPerStepDefFile} step definitions`)
  log(`Node ${process.version}`)
  log('')

  const globalRoot = path.join(__dirname, 'generated', 'global')
  const scopedRoot = path.join(__dirname, 'generated', 'scoped')
  const g = generate(globalRoot, 'global', OPTS)
  const s = generate(scopedRoot, 'scoped', OPTS)

  // ---- Bench A: bundling (the user-facing cost) ----
  log(`## A. Per-spec bundling time + output size (mirrors one-bundle-per-spec)`)
  log('')
  const esG = await benchBundle.bundleEsbuild(globalRoot, g.featurePaths)
  const esS = await benchBundle.bundleEsbuild(scopedRoot, s.featurePaths)

  const wpFeaturesG = g.featurePaths.slice(0, WEBPACK_SUBSET)
  const wpFeaturesS = s.featurePaths.slice(0, WEBPACK_SUBSET)
  let wpG, wpS
  try {
    wpG = await benchBundle.bundleWebpack(globalRoot, wpFeaturesG)
    wpS = await benchBundle.bundleWebpack(scopedRoot, wpFeaturesS)
  } catch (e) {
    log(`> webpack benchmark skipped: ${e.message.split('\n')[0]}`)
  }

  log('| bundler | step-defs | features | total time | per-feature | per-feature bundle |')
  log('|---|---|---:|---:|---:|---:|')
  log(`| esbuild | global | ${esG.count} | ${fmtMs(esG.ms)} | ${fmtMs(esG.ms / esG.count)} | ${fmtKb(esG.totalBytes / esG.count)} |`)
  log(`| esbuild | scoped | ${esS.count} | ${fmtMs(esS.ms)} | ${fmtMs(esS.ms / esS.count)} | ${fmtKb(esS.totalBytes / esS.count)} |`)
  if (wpG) {
    log(`| webpack | global | ${wpG.count} | ${fmtMs(wpG.ms)} | ${fmtMs(wpG.ms / wpG.count)} | ${fmtKb(wpG.totalBytes / wpG.count)} |`)
    log(`| webpack | scoped | ${wpS.count} | ${fmtMs(wpS.ms)} | ${fmtMs(wpS.ms / wpS.count)} | ${fmtKb(wpS.totalBytes / wpS.count)} |`)
  }
  log('')
  log(`- esbuild vs webpack (global, per-feature): **${wpG ? fmtX(wpG.ms / wpG.count, esG.ms / esG.count) : 'n/a'} faster** with esbuild`)
  log(`- global vs scoped (esbuild, per-feature time): **${fmtX(esG.ms / esG.count, esS.ms / esS.count)}**; bundle size **${fmtX(esG.totalBytes / esG.count, esS.totalBytes / esS.count)}** smaller when scoped`)
  log('')

  // ---- Bench B: glob memoization (#4) ----
  log(`## B. Step-definition glob discovery — memoization (improvement #4)`)
  log('')
  const globRes = await benchGlob.run({
    root: globalRoot,
    features: OPTS.features,
    patterns: ['cypress/support/step_definitions/**/*.js'],
  })
  log('| variant | calls (1/feature) | total time |')
  log('|---|---:|---:|')
  log(`| baseline (re-glob per feature) | ${globRes.calls} | ${fmtMs(globRes.baseline)} |`)
  log(`| memoized (cache per pattern) | ${globRes.calls} | ${fmtMs(globRes.improved)} |`)
  log('')
  log(`- **${fmtX(globRes.baseline, globRes.improved)} faster** glob discovery across the run (global patterns are identical per feature).`)
  log('')

  // ---- Bench C: registry matching cache (#2) ----
  log(`## C. Registry step matching — text cache (improvement #2)`)
  log('')
  // Matching is incurred per step at BOTH load (pickleStepToTestStep) and run
  // time, summed across every spec in the run — so size it to a cumulative
  // large-suite volume rather than a single spec.
  const stepDefCount = OPTS.stepDefFiles * OPTS.stepsPerStepDefFile
  const totalOcc = 2 * OPTS.features * OPTS.scenariosPerFeature * OPTS.stepsPerScenario
  const regRes = benchRegistry.run({
    stepDefCount,
    uniqueSteps: stepDefCount,
    totalOccurrences: totalOcc,
  })
  log('| variant | step-defs | step occurrences | total time |')
  log('|---|---:|---:|---:|')
  log(`| baseline (linear scan + re-match) | ${regRes.stepDefCount} | ${regRes.totalOccurrences} | ${fmtMs(regRes.baseline)} |`)
  log(`| cached (memo by step text) | ${regRes.stepDefCount} | ${regRes.totalOccurrences} | ${fmtMs(regRes.improved)} |`)
  log('')
  log(`- **${fmtX(regRes.baseline, regRes.improved)} faster** step matching. Baseline cost scales with (occurrences x step-def count); also incurred a 2nd time eagerly at load (pickleStepToTestStep).`)
  log('')

  // ---- Bench D: payload size (#908) ----
  log(`## D. Generated-module / inlined-payload size (#908)`)
  log('')
  const payG = await benchPayload.run(globalRoot, g.featurePaths)
  log('| metric | value |')
  log('|---|---:|')
  log(`| avg generated module / feature | ${fmtKb(payG.avg)} |`)
  log(`| max generated module / feature | ${fmtKb(payG.max)} |`)
  log(`| total across ${payG.count} features | ${fmtKb(payG.total)} |`)
  log('')
  log(`> The gherkinDocument + pickles + raw source are JSON-inlined into every feature bundle and re-serialized to the browser/Cloud. Grows with scenarios/feature; was the cause of >22 MiB payloads in #908.`)
  log('')

  fs.writeFileSync(path.join(__dirname, 'RESULTS.md'), out.join('\n'))
  console.log('\nWrote RESULTS.md')
}

main().catch((e) => { console.error(e); process.exit(1) })
