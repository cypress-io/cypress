import systemTests from '../lib/system-tests'

describe('e2e tests with mount import', () => {
  systemTests.setup()

  // see: https://github.com/cypress-io/cypress/issues/22589
  systemTests.it('should not run CT side effects in e2e with mount registration', {
    project: 'component-tests',
    spec: 'passing-with-mount.cy.js',
    browser: 'chrome',
    configFile: 'cypress-e2e-mount-import.config.js',
    expectedExitCode: 0,
  })
})
