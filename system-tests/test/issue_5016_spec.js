const systemTests = require('../lib/system-tests').default

describe('e2e issue 5016 - screenshot times out after clicking target _blank', function () {
  systemTests.setup()

  // this test originally was scoped to !webkit, but Firefox has a (non-regression) flake
  // issue: https://github.com/cypress-io/cypress/issues/29116
  systemTests.it('fails but does not timeout taking screenshot', {
    project: 'config-screenshot-on-failure-enabled',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
    expectedExitCode: 1,
    browser: 'chrome',
  })

  systemTests.it('fails but does not timeout taking screenshot', {
    project: 'config-screenshot-on-failure-enabled',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
    expectedExitCode: 1,
    browser: 'electron',
  })
})
