const e2e = require('../lib/e2e').default
const Fixtures = require('../lib/fixtures')

const uncaughtSupportFile = Fixtures.projectPath('uncaught-support-file')

describe('e2e uncaught support file errors', () => {
  e2e.setup()

  it('failing', function () {
    return e2e.exec(this, {
      project: uncaughtSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
    })
  })
})
