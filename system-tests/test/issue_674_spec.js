const systemTests = require('../lib/system-tests').default

describe('e2e issue 674', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/674
  systemTests.it('fails', {
    browser: '!webkit', // TODO(webkit): fix+unskip (failing due to broken stack trace)
    spec: 'issue_674.cy.js',
    snapshot: true,
    expectedExitCode: 1,
  })
})
