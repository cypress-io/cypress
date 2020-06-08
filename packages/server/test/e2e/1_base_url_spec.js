const e2e = require('../support/helpers/e2e').default

const onServer = (app) => {
  return app.get('/app/html', (req, res) => {
    return res.send('<html>Herman Melville</html>')
  })
}

describe('e2e baseUrl', () => {
  context('https', () => {
    e2e.setup({
      settings: {
        baseUrl: 'https://httpbin.org',
      },
    })

    e2e.it('passes', {
      spec: 'base_url_spec.coffee',
      snapshot: true,
    })
  })

  context('http', () => {
    e2e.setup({
      servers: {
        port: 9999,
        onServer,
      },
      settings: {
        baseUrl: 'http://localhost:9999/app',
      },
    })

    e2e.it('passes', {
      spec: 'base_url_spec.coffee',
      snapshot: true,
    })
  })
})
