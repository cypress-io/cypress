const systemTests = require('../lib/system-tests').default

describe('e2e task', () => {
  systemTests.setup()

  it('fails', function () {
    return systemTests.exec(this, {
      project: 'task-not-registered',
      spec: 'task_not_registered.cy.js',
      snapshot: true,
      expectedExitCode: 1,
      config: { screenshotOnRunFailure: false },
    })
  })
})
