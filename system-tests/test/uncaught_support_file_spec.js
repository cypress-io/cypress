const systemTests = require('../lib/system-tests').default

describe('e2e uncaught support file errors', () => {
  systemTests.setup()

  it('failing', function () {
    return systemTests.exec(this, {
      project: 'uncaught-support-file',
      snapshot: true,
      expectedExitCode: 1,
      config: { screenshotOnRunFailure: false },
    })
  })
})
