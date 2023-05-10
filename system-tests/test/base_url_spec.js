const systemTests = require('../lib/system-tests').default

const onServer = (app) => {
  return app.get('/app/html', (req, res) => {
    return res.send('<html>Herman Melville</html>')
  })
}

describe('e2e baseUrl', () => {
  context('https', () => {
    systemTests.setup({
      servers: {
        port: 443,
        https: true,
        onServer,
      },
      settings: {
        e2e: {
          baseUrl: 'https://localhost/app',
        },
      },
    })

    systemTests.it('passes', {
      spec: 'base_url.cy.js',
      snapshot: true,
    })
  })

  context('http', () => {
    systemTests.setup({
      servers: {
        port: 9999,
        onServer,
      },
      settings: {
        e2e: {
          baseUrl: 'http://localhost:9999/app',
        },
      },
    })

    systemTests.it('passes', {
      spec: 'base_url.cy.js',
      snapshot: true,
    })
  })
})
