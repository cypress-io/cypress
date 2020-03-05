import _ from 'lodash'
import { expect } from 'chai'
const e2e = require('../support/helpers/e2e')

describe('e2e browser crashing', function () {
  e2e.setup()

  e2e.it('gracefully handles CDP-simulated crashes', {
    spec: 'browser_crashing_sadface*_spec.js',
    expectedExitCode: 3,
    browser: ['chrome', 'electron'],
    snapshot: true,
    onRun (exec, browser) {
      return exec({
        onStdout: (stdout) => {
          const needle = `the ${_.upperFirst(browser)} process`

          expect(stdout).to.contain(needle)

          return stdout.replace(needle, 'the FooBrowser process')
        },
      })
    },
  })

  // NOTE: this takes a while, so don't run it in CI
  e2e.it.skip('gracefully handles real crashes', {
    timeout: 10 * 60 * 1000,
    spec: 'browser_freeze_*_spec.js',
    expectedExitCode: 2,
    snapshot: false,
  })
})
