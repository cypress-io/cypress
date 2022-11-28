const systemTests = require('../lib/system-tests').default

const onServer = function (app) {
  app.get('/first', (req, res) => {
    return res.send('<html><h1>first</h1><a href=\'/second\'>second</a></html>')
  })

  return app.get('/second', (req, res) => {
    return res.send('<html><h1>second</h1></html>')
  })
}

describe('e2e go', () => {
  systemTests.setup({
    servers: {
      port: 1818,
      onServer,
    },
  })

  // this tests that history changes work as intended
  // there have been regressions in electron which would
  // otherwise cause these tests to fail
  systemTests.it('passes', {
    spec: 'go.cy.js',
    snapshot: true,
  })
})
