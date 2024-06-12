const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/', (req, res) => {
    return res.send('<html>hi there</html>')
  })

  app.get('/req', (req, res) => {
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

  it('passes', function () {
    return systemTests.exec(this, {
      spec: 'block_hosts.cy.js',
      snapshot: true,
    })
  })
})
