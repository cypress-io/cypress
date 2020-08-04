// TODO: rename this file to 5_module_api_spec

const path = require('path')
const snapshot = require('snap-shot-it')
const fs = require('../../lib/util/fs')
const e2e = require('../support/helpers/e2e').default
const Fixtures = require('../support/helpers/fixtures')
const { expectCorrectModuleApiResult } = require('../support/helpers/resultsUtils')

const e2ePath = Fixtures.projectPath('e2e')

const outputPath = path.join(e2ePath, 'output.json')

const specs = [
  'simple_passing_spec.coffee',
  'simple_hooks_spec.coffee',
  'simple_failing_spec.coffee',
  'simple_failing_h*_spec.coffee', // simple failing hook spec
].join(',')

describe('e2e spec_isolation', () => {
  e2e.setup()

  e2e.it('fails', {
    spec: specs,
    outputPath,
    snapshot: false,
    expectedExitCode: 5,
    async onRun (exec) {
      await exec()

      // now what we want to do is read in the outputPath
      // and snapshot it so its what we expect after normalizing it
      const json = await fs.readJsonAsync(outputPath)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, {
        e2ePath, runs: 4,
      })

      snapshot('e2e spec isolation fails', json, { allowSharedSnapshot: true })
    },
  })

  e2e.it('failing with retries enabled', {
    spec: 'simple_failing_hook_spec.coffee',
    outputPath,
    snapshot: true,
    expectedExitCode: 3,
    config: {
      retries: 1,
    },
    async onRun (execFn) {
      await execFn()
      const json = await fs.readJsonAsync(outputPath)

      // also mutates into normalized obj ready for snapshot
      expectCorrectModuleApiResult(json, { e2ePath, runs: 1 })

      snapshot('failing with retries enabled', json)
    },
  })
})
