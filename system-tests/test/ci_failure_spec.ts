import systemTests from '../lib/system-tests'

describe('CI failure', () => {
  systemTests.setup()

  it('fails and displays the message that points users to the cloud', function () {
    return systemTests.exec(this, {
      browser: 'electron',
      spec: 'simple_failing.cy.js',
      processEnv: {
        CI: '1',
        CYPRESS_COMMERCIAL_RECOMMENDATIONS: '1',
      },
      expectedExitCode: 2,
      snapshot: true,
      config: {
        screenshotOnRunFailure: false,
      },
    })
  })
})
