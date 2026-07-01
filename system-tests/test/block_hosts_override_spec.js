const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/', (req, res) => {
    return res.send('<html>hi there</html>')
  })

  return app.get('/req', (req, res) => {
    // allow the cross-origin XHR to read the response so an unblocked request
    // (200) is distinguishable from a proxy-blocked one (503 -> status 0)
    res.header('Access-Control-Allow-Origin', '*')

    return res.sendStatus(200)
  })
}

// https://github.com/cypress-io/cypress/issues/21151
describe('e2e blockHosts test config override', () => {
  systemTests.setup({
    servers: [{
      port: 3131,
      onServer,
    }, {
      port: 3232,
      onServer,
    }],
    settings: {
      blockHosts: 'localhost:3131',
      e2e: {
        allowCypressEnv: false,
        baseUrl: 'http://localhost:3232',
      },
    },
  })

  it('applies blockHosts test config overrides at runtime', function () {
    return systemTests.exec(this, {
      spec: 'block_hosts_override.cy.js',
    })
  })
})
