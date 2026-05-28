import systemTests from '../lib/system-tests'

const onServer = function (app) {
  app.get('/index.html', (req, res) => {
    return res.send('<html><body><h1>index</h1></body></html>')
  })
}

describe('fails prior to top change retry succeeds', () => {
  systemTests.setup({
    servers: {
      port: 5353,
      onServer,
    },
  })

  systemTests.it('shows the correct retry number in the reporter', {
    browser: 'chrome',
    project: 'e2e',
    spec: 'fails_prior_to_top_change_retry_succeeds.cy.ts',
    snapshot: true,
    expectedExitCode: 0,
    config: {
      retries: {
        runMode: 2,
      },
    },
  })
})
