const e2e = require('../support/helpers/e2e')

describe('e2e browser crashing', function () {
  e2e.setup()

  e2e.it('is gracefully handled', {
    spec: 'browser_crashing_spec.js',
    expectedExitCode: 0,
    snapshot: true,
  })
})
