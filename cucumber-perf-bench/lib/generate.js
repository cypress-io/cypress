'use strict'

// Generates a synthetic Cypress + cucumber project on disk for benchmarking.
//
// Two step-definition layouts are produced from the same feature set:
//   - "global": one shared pool of step-definition files under
//     cypress/support/step_definitions, matched by a global glob. Every feature
//     bundle must require ALL of them (the default, worst-case fan-out).
//   - "scoped": one co-located step-def file per feature, matched by the
//     [filepath] token. Every feature bundle requires only its own steps.

const fs = require('node:fs')
const path = require('node:path')

function rmrf (p) {
  fs.rmSync(p, { recursive: true, force: true })
}

function write (p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content)
}

// A pool of unique, parameter-free step phrases. Parameter-free keeps matching
// unambiguous so every feature step resolves to exactly one definition.
function stepPhrase (i) {
  return `the system performs operation number ${i}`
}

function genStepDefFile (stepIndexes) {
  const lines = [
    `const { Given } = require('@badeball/cypress-cucumber-preprocessor')`,
    '',
  ]

  for (const i of stepIndexes) {
    lines.push(`Given('${stepPhrase(i)}', () => {})`)
  }

  lines.push('')

  return lines.join('\n')
}

function genFeature (featureIdx, opts, stepUniverse) {
  const lines = [`Feature: feature ${featureIdx}`, '']

  for (let s = 0; s < opts.scenariosPerFeature; s++) {
    lines.push(`  Scenario: scenario ${featureIdx}-${s}`)
    for (let st = 0; st < opts.stepsPerScenario; st++) {
      // Deterministic spread across the available step universe.
      const idx = stepUniverse[(featureIdx * 131 + s * 17 + st * 7) % stepUniverse.length]
      lines.push(`    Given ${stepPhrase(idx)}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

/**
 * @param {string} root absolute project root to (re)create
 * @param {'global'|'scoped'} layout
 * @param {object} opts
 */
function generate (root, layout, opts) {
  rmrf(root)
  fs.mkdirSync(root, { recursive: true })

  const totalGlobalSteps = opts.stepDefFiles * opts.stepsPerStepDefFile
  const globalUniverse = Array.from({ length: totalGlobalSteps }, (_, i) => i)

  // package.json so the preprocessor's require('@badeball/...') resolves via the
  // harness node_modules (a symlink is created by the caller).
  write(path.join(root, 'package.json'), JSON.stringify({ name: 'bench-project', version: '1.0.0' }, null, 2))

  if (layout === 'global') {
    // Shared pool of step-def files.
    for (let f = 0; f < opts.stepDefFiles; f++) {
      const indexes = Array.from({ length: opts.stepsPerStepDefFile }, (_, k) => f * opts.stepsPerStepDefFile + k)
      write(
        path.join(root, 'cypress/support/step_definitions', `steps_${f}.js`),
        genStepDefFile(indexes),
      )
    }

    write(
      path.join(root, '.cypress-cucumber-preprocessorrc.json'),
      JSON.stringify({ stepDefinitions: ['cypress/support/step_definitions/**/*.js'] }, null, 2),
    )
  } else {
    write(
      path.join(root, '.cypress-cucumber-preprocessorrc.json'),
      JSON.stringify({ stepDefinitions: ['cypress/e2e/[filepath].js'] }, null, 2),
    )
  }

  const featurePaths = []

  for (let f = 0; f < opts.features; f++) {
    const featurePath = path.join(root, 'cypress/e2e', `feat_${f}.feature`)
    write(featurePath, genFeature(f, opts, globalUniverse))
    featurePaths.push(featurePath)

    if (layout === 'scoped') {
      // Co-located step-def file defining exactly the (unique) steps this
      // feature references.
      const used = new Set()
      for (let s = 0; s < opts.scenariosPerFeature; s++) {
        for (let st = 0; st < opts.stepsPerScenario; st++) {
          used.add(globalUniverse[(f * 131 + s * 17 + st * 7) % globalUniverse.length])
        }
      }
      write(
        path.join(root, 'cypress/e2e', `feat_${f}.js`),
        genStepDefFile([...used].sort((a, b) => a - b)),
      )
    }
  }

  return { root, featurePaths, totalGlobalSteps }
}

module.exports = { generate, stepPhrase }
