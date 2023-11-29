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

  context('https basic auth', () => {
    systemTests.setup({
      servers: {
        port: 443,
        https: true,
        onServer,
      },
      settings: {
        e2e: {
          baseUrl: 'https://test:test@localhost/app',
        },
      },
    })

    systemTests.it('passes', {
      spec: 'base_url.cy.js',
      browser: 'chrome',
      snapshot: true,
    })
  })

  // https://github.com/cypress-io/cypress/issues/28336
  context('basic auth + privileged commands', () => {
    systemTests.setup({
      servers: {
        port: 9999,
        onServer,
      },
    })

    systemTests.it('passes', {
      browser: 'chrome',
      project: 'privileged-commands',
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
