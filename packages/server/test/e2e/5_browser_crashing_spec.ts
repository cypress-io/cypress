import _ from 'lodash'
import { expect } from 'chai'
const e2e = require('../support/helpers/e2e')

describe('e2e browser crashing', function () {
  e2e.setup()

  e2e.it('is gracefully handled', {
    spec: 'browser_crashing_spec.js',
    expectedExitCode: 1,
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
})
