import systemTests from '../lib/system-tests'

const onServer = function (app) {
  app.get('/opener', (req, res) => {
    res.send('<html><body><h1>opener</h1></body></html>')
  })

  app.get('/popup', (req, res) => {
    res.send('<html><body><h1>popup</h1></body></html>')
  })
}

describe('e2e extra target (window.open)', () => {
  systemTests.setup({
    servers: {
      port: 1920,
      onServer,
    },
  })

  // Opening popups/new tabs creates extra browser targets that Cypress attaches
  // to in a paused state. Previously, if connecting to one of those targets
  // hung, the target was never resumed and the run could hang between tests.
  // This guards against a regression by running multiple tests that each open
  // an extra target and asserting the run completes successfully.
  // https://github.com/cypress-io/cypress/issues/32956
  systemTests.it('runs to completion when tests open popups (extra targets)', {
    project: 'e2e',
    spec: 'extra_target_window_open_spec.cy.js',
    // only chromium-family browsers and electron fully manage tabs/targets via CDP
    browser: ['chrome', 'electron'],
    expectedExitCode: 0,
  })
})
