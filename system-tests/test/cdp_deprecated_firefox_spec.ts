import systemTests from '../lib/system-tests'

describe('CDP deprecated in Firefox', () => {
  systemTests.setup()

  systemTests.it('logs a warning to the user that CDP is deprecated and will be removed in Cypress 15', {
    browser: 'firefox',
    processEnv: {
      FORCE_FIREFOX_CDP: '1',
    },
    expectedExitCode: 0,
    snapshot: true,
    spec: 'simple_passing.cy.js',
    onStdout: (stdout) => {
      expect(stdout).to.include('Since Firefox 129, Chrome DevTools Protocol (CDP) has been deprecated in Firefox. In Firefox 135 and above, Cypress defaults to automating the Firefox browser with WebDriver BiDi. Cypress will no longer support CDP within Firefox in the future and is planned for removal in Cypress 15.')
    },
  })
})
