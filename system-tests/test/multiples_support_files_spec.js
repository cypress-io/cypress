const systemTests = require('../lib/system-tests').default

describe('e2e multiples support files', () => {
  systemTests.setup()

  it('passes', function () {
    return systemTests.exec(this, {
      project: 'multiples-support-files',
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })
})
