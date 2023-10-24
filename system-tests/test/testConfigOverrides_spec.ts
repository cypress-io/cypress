import fs from 'fs-extra'
import path from 'path'
import systemTests, { expect, BrowserName } from '../lib/system-tests'
import Fixtures from '../lib/fixtures'

const e2ePath = Fixtures.projectPath('e2e')

const outputPath = path.join(e2ePath, 'output.json')

describe('testConfigOverrides', () => {
  systemTests.setup()

  systemTests.it('successfully runs valid suite-level-only overrides', {
    spec: 'testConfigOverrides/valid-suite-only.js',
    snapshot: true,
    expectedExitCode: 0,
    browser: 'electron',
  })

  systemTests.it('fails when passing invalid config value browser', {
    spec: 'testConfigOverrides/invalid-browser.js',
    snapshot: true,
    expectedExitCode: 1,
  })

  systemTests.it('has originalTitle when skipped due to browser config', {
    spec: 'testConfigOverrides/skip-browser.js',
    snapshot: true,
    outputPath,
    browser: 'electron',
    async onRun (exec) {
      await exec()
      const results = await fs.readJson(outputPath)

      // make sure we've respected test title when creating title path
      expect(results.runs[0].tests[0].title).deep.eq(['suite', 'is skipped due to test-level browser override'])
      expect(results.runs[0].tests[1].title).deep.eq(['suite 2', 'is skipped due to suite-level browser override'])
    },
  })

  systemTests.it('fails when setting invalid config opt with Cypress.config() in before:test:run', {
    spec: 'testConfigOverrides/invalid_before_test_event.js',
    snapshot: true,
    outputPath,
    browser: 'electron',
    expectedExitCode: 2,
  })

  systemTests.it('fails when setting invalid config opt with Cypress.config() in before:test:run:async', {
    spec: 'testConfigOverrides/invalid_before_test_async_event.js',
    snapshot: true,
    outputPath,
    browser: 'electron',
    expectedExitCode: 2,
  })

  // window.Error throws differently for firefox. break into
  // browser permutations for snapshot comparisons
  const permutations: BrowserName[][] = [
    ['chrome', 'electron'],
    ['firefox'],
  ]

  permutations.forEach((browserList) => {
    systemTests.it(`fails when passing invalid config values - [${browserList}]`, {
      spec: 'testConfigOverrides/invalid.js',
      snapshot: true,
      browser: browserList,
      expectedExitCode: 14,
    })

    systemTests.it(`fails when passing invalid config values with beforeEach - [${browserList}]`, {
      spec: 'testConfigOverrides/before-invalid.js',
      snapshot: true,
      browser: browserList,
      expectedExitCode: 8,
    })

    systemTests.it(`correctly fails when invalid config values for it.only [${browserList}]`, {
      spec: 'testConfigOverrides/only-invalid.js',
      snapshot: true,
      browser: browserList,
      expectedExitCode: 1,
    })

    describe('experimental retries specific behavior', () => {
      systemTests.it(`fails when attempting to set experimental retries as override [${browserList}]`, {
        spec: 'override-with-experimental-retries.cy.js',
        project: 'experimental-retries',
        configFile: 'cypress-legacy-retries.config.js',
        expectedExitCode: 2,
        browser: browserList,
        snapshot: true,
      })

      systemTests.it(`succeeds when setting legacy retries as an override to experimental retries [${browserList}]`, {
        spec: 'override-with-legacy-retries.cy.js',
        project: 'experimental-retries',
        configFile: 'cypress-experimental-retries.config.js',
        expectedExitCode: 0,
        browser: browserList,
        snapshot: true,
      })
    })
  })
})
