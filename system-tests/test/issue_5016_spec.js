const systemTests = require('../lib/system-tests').default

describe('e2e issue 5016 - screenshot times out after clicking target _blank', function () {
  systemTests.setup()

  it('fails but does not timeout taking screenshot', function () {
    return systemTests.exec(this, {
      project: 'config-screenshot-on-failure-enabled',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      browser: 'chrome',
      expectedExitCode: 1,
    })
  })
})
