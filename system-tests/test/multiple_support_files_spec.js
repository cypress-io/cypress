const systemTests = require('../lib/system-tests').default

describe('e2e multiple support files', () => {
  systemTests.setup()

  it('passes', function () {
    return systemTests.exec(this, {
      project: 'multiple-support-files',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })
})
