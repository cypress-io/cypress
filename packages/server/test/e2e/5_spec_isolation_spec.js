// TODO: rename this file to 5_module_api_spec

const path = require('path')
const _ = require('lodash')
const snapshot = require('snap-shot-it')
const fs = require('../../lib/util/fs')
const { default: e2e, STDOUT_DURATION_IN_TABLES_RE } = require('../support/helpers/e2e')
const Fixtures = require('../support/helpers/fixtures')
const { expectCorrectModuleApiResult } = require('../support/helpers/resultsUtils')
const e2ePath = Fixtures.projectPath('e2e')
const { it } = e2e

const outputPath = path.join(e2ePath, 'output.json')

const specs = [
  'simple_passing_spec.coffee',
  'simple_hooks_spec.coffee',
  'simple_failing_spec.coffee',
  'simple_failing_h*_spec.coffee', // simple failing hook spec
].join(',')

describe('e2e spec_isolation', () => {
  e2e.setup()

  it('fails', {
    spec: specs,
    outputPath,
    snapshot: false,
    expectedExitCode: 5,
    config: {
      video: false,
    },
    async onRun (execFn) {
      const { stdout } = await execFn()

      _.each(STDOUT_DURATION_IN_TABLES_RE.exec(stdout), (str) => {
        expect(str.trim(), 'spec durations in tables should not be 0ms').not.eq('0ms')
      })

      // now what we want to do is read in the outputPath
      // and snapshot it so its what we expect after normalizing it
      let json = await fs.readJsonAsync(outputPath)

      json.runs = e2e.normalizeRuns(json.runs)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, {
        e2ePath, runs: 4, video: false,
      })

      snapshot(json, { allowSharedSnapshot: true })
    },
  })

  it('failing with retries enabled', {
    spec: 'simple_failing_hook_spec.coffee,simple_retrying_spec.js',
    outputPath,
    snapshot: true,
    expectedExitCode: 4,
    config: {
      retries: 1,
      video: false,
    },
    async onRun (execFn) {
      await execFn()
      let json = await fs.readJsonAsync(outputPath)

      json.runs = e2e.normalizeRuns(json.runs)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, {
        e2ePath, runs: 2, video: false,
      })

      snapshot(json)
    },
  })
})
