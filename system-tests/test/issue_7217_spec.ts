import path from 'path'
import systemTests from '../lib/system-tests'

describe('e2e issue 7217', () => {
  systemTests.setup()

  // this test ensures that the right error is reported if the
  // browser can't connect
  // https://github.com/cypress-io/cypress/issues/7217
  systemTests.it('shows correct error if browser does not connect', {
    expectedExitCode: 1,
    spec: 'simple_passing.cy.js',
    processEnv: {
      CYPRESS_INTERNAL_RUNNER_PATH: path.resolve(__dirname, '../support/fixtures/no-connect.html'),
      CYPRESS_INTERNAL_BROWSER_CONNECT_TIMEOUT: 10,
    },
    browser: 'electron',
    snapshot: true,
  })
})
