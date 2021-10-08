const Fixtures = require('../lib/fixtures')
const e2e = require('../lib/e2e').default

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
