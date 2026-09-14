const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/', (req, res) => {
    return res.send('<html>hi there</html>')
  })

  return app.get('/req', (req, res) => {
    // allow the cross-origin fetch to read the response so an allowed request is
    // distinguishable from a blocked one, which has no CORS headers
    res.header('Access-Control-Allow-Origin', '*')

    return res.sendStatus(200)
  })
}

describe('e2e blockHosts test config override', () => {
  systemTests.setup({
    servers: [{
      port: 3131,
      onServer,
    }, {
      port: 3232,
      onServer,
    }, {
      port: 3333,
      onServer,
    }],
    settings: {
      blockHosts: 'localhost:3131',
      e2e: {
        baseUrl: 'http://localhost:3232',
      },
    },
  })

  systemTests.it('applies blockHosts test config overrides at runtime', {
    browser: ['chrome', 'electron'],
    spec: 'block_hosts_override.cy.js',
  })
})
