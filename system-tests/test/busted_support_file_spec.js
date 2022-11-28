const systemTests = require('../lib/system-tests').default

describe('e2e busted support file', () => {
  systemTests.setup()

  it('passes', function () {
    return systemTests.exec(this, {
      project: 'busted-support-file',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })
})
