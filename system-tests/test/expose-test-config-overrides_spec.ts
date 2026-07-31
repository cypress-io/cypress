import systemTests from '../lib/system-tests'

describe('Cypress.expose() test config overrides', () => {
  systemTests.setup()

  systemTests.it('runs Cypress.expose() test config override specs', {
    project: 'expose-test-config-overrides',
    expectedExitCode: 0,
    browser: 'electron',
  })
})
