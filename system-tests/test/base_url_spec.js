const systemTests = require('../lib/system-tests').default

const onServer = (app) => {
  return app.get('/app/html', (req, res) => {
    return res.send('<html>Herman Melville</html>')
  })
}

describe('e2e baseUrl', () => {
  context('https', () => {
    systemTests.setup({
      settings: {
        baseUrl: 'https://httpbin.org',
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
        baseUrl: 'http://localhost:9999/app',
      },
    })

    systemTests.it('passes', {
      spec: 'base_url.cy.js',
      snapshot: true,
    })
  })
})
