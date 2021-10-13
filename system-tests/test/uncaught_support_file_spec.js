const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const uncaughtSupportFile = Fixtures.projectPath('uncaught-support-file')

describe('e2e uncaught support file errors', () => {
  systemTests.setup()

  it('failing', function () {
    return systemTests.exec(this, {
      project: uncaughtSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
