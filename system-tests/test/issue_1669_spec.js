const systemTests = require('../lib/system-tests').default

describe('e2e issue 1669', () => {
  systemTests.setup()

  // https://github.com/cypress-io/cypress/issues/1669
  it('passes', function () {
    return systemTests.exec(this, {
      spec: 'issue_1669.cy.js',
      snapshot: true,
      browser: 'chrome',
      expectedExitCode: 1,
    })
  })
})
