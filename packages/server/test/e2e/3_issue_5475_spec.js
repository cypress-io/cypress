const e2e = require('../support/helpers/e2e').default

describe('e2e issue 5475 history pushState hangs', function () {
  e2e.setup()

  e2e.it('fails when remote debugging port cannot be connected to', {
    spec: 'issue_5475*',
    browser: 'electron',
    expectedExitCode: 1,
    snapshot: true,
  })
})
