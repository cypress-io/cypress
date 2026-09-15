const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/', (req, res) => {
    return res.send('<html>hi there</html>')
  })

  app.get('/req', (req, res) => {
    // without this an allowed cross-origin request fails on CORS and reports the same
    // zero status as a blocked one, so the test would pass even when nothing is blocked
    res.header('Access-Control-Allow-Origin', '*')

    return res.sendStatus(200)
  })

  return app.get('/status', (req, res) => {
    return res.sendStatus(503)
  })
}

describe('e2e blockHosts', () => {
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
        baseUrl: 'http://localhost:3232',
      },
    },
  })

  // Chrome enforces blockHosts on the browser network (CDP Fetch) path.
  // Electron enforces it on the MITM proxy. Cover both.
  systemTests.it('passes', {
    browser: ['chrome', 'electron'],
    spec: 'block_hosts.cy.js',
    snapshot: true,
  })
})
