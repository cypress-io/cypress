import e2e, { expect } from '../support/helpers/e2e'
import path from 'path'
import fs from 'fs-extra'
const Fixtures = require('../support/helpers/fixtures')
const e2ePath = Fixtures.projectPath('e2e')

const outputPath = path.join(e2ePath, 'output.json')

describe('per-test-config', () => {
  e2e.setup()

  e2e.it('fails when passing invalid config value browser', {
    spec: 'per-test-config-invalid-browser.js',
    snapshot: true,
    expectedExitCode: 1,

  })

  e2e.it('has originalTitle when skip due to browser config', {
    spec: 'per-test-config-skip-browser.js',
    snapshot: true,
    outputPath,
    browser: 'electron',
    async onRun (exec) {
      await exec()
      const results = await fs.readJson(outputPath)

      // make sure we've respected test.originalTitle
      expect(results.runs[0].tests[0].title).deep.eq(['suite', 'has invalid per-test-config'])
    },
  })
})
