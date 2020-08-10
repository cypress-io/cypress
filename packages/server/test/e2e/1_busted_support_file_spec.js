const Fixtures = require('../support/helpers/fixtures')
const e2e = require('../support/helpers/e2e').default

const bustedSupportFile = Fixtures.projectPath('busted-support-file')

describe('e2e busted support file', () => {
  e2e.setup()

  it('passes', function () {
    return e2e.exec(this, {
      project: bustedSupportFile,
      sanitizeScreenshotDimensions: true,
      snapshot: true,
      expectedExitCode: 1,
      onStdout: e2e.normalizeWebpackErrors,
    })
  })
})
