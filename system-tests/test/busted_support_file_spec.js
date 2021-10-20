const Fixtures = require('../lib/fixtures')
const systemTests = require('../lib/system-tests').default

const bustedSupportFile = Fixtures.projectPath('busted-support-file')

describe('e2e busted support file', () => {
  systemTests.setup()

  it('passes', function () {
    return systemTests.exec(this, {
      project: bustedSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      onStdout: systemTests.normalizeWebpackErrors,
    })
  })
})
