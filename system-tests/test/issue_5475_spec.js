const systemTests = require('../lib/system-tests').default

describe('e2e issue 5475 history pushState hangs', function () {
  systemTests.setup()

  systemTests.it('fails when remote debugging port cannot be connected to', {
    spec: 'issue_5475*',
    browser: 'electron',
    expectedExitCode: 1,
    snapshot: true,
  })
})
