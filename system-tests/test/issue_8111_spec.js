const systemTests = require('../lib/system-tests').default

describe('e2e issue 8111 iframe input focus', function () {
  systemTests.setup()

  // TODO: fix flaky test https://github.com/cypress-io/cypress/issues/23318
  systemTests.it.skip('iframe input retains focus when browser is out of focus', {
    // this test is dependent on the browser being Chrome headed
    // and also having --auto-open-devtools-for-tabs plugins option
    // (which pulls focus from main browser window)
    project: 'issue-8111-iframe-input',
    spec: 'iframe_input.cy.js',
    browser: 'chrome',
    headed: true,
  })
})
