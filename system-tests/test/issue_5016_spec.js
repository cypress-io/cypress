const systemTests = require('../lib/system-tests').default

describe('e2e issue 5016 - screenshot times out after clicking target _blank', function () {
  systemTests.setup()
  before(() => {
    process.env.DEBUG = 'cypress:server:*'
  })

  after(() => {
    process.env.DEBUG = ''
  })

  systemTests.it('fails but does not timeout taking screenshot', {
    project: 'config-screenshot-on-failure-enabled',
    sanitizeScreenshotDimensions: true,
    snapshot: true,
    expectedExitCode: 1,
    browser: '!webkit',
    // env: 'DEBUG=cypress:server:*',
  })
})
