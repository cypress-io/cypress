const path = require('path')
const _ = require('lodash')
const { fs } = require('@packages/server/lib/util/fs')
const { default: systemTests } = require('../lib/system-tests')
const { STDOUT_DURATION_IN_TABLES_RE, e2ePath } = require('../lib/normalizeStdout')
const { expectCorrectModuleApiResult } = require('../lib/resultsUtils')
const { it } = systemTests

const outputPath = path.join(e2ePath, 'output.json')

const specs = [
  'simple_passing.cy.js',
  'simple_hooks.cy.js',
  'simple_failing.cy.js',
  'simple_failing_h*.cy.js', // simple failing hook spec
].join(',')

describe('module api', () => {
  systemTests.setup()

  it('fails', {
    spec: specs,
    outputPath,
    expectedExitCode: 5,
    config: {
      experimentalWebKitSupport: true,
    },
    async onRun (execFn) {
      const { stdout } = await execFn()

      _.each(STDOUT_DURATION_IN_TABLES_RE.exec(stdout), (str) => {
        expect(str.trim(), 'spec durations in tables should not be 0ms').not.eq('0ms')
      })

      // now what we want to do is read in the outputPath
      // and snapshot it so its what we expect after normalizing it
      let json = await fs.readJsonAsync(outputPath)

      json.runs = systemTests.normalizeRuns(json.runs)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, {
        e2ePath, runs: 4, video: false,
      })
    },
  })

  it('failing with retries enabled', {
    spec: 'simple_failing_hook.cy.js,simple_retrying.cy.js',
    outputPath,
    expectedExitCode: 4,
    config: {
      experimentalWebKitSupport: true,
      retries: 1,
      video: false,
    },
    async onRun (execFn) {
      await execFn()
      let json = await fs.readJsonAsync(outputPath)

      json.runs = systemTests.normalizeRuns(json.runs)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, {
        e2ePath,
        runs: 2,
        video: false,
      })
    },
  })
})
