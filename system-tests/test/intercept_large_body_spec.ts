import systemTests from '../lib/system-tests'

const it = systemTests.it

const PORT = 3471

// https://github.com/cypress-io/cypress/issues/34964
// https://github.com/cypress-io/cypress/issues/35025
//
// On the CDP network path, a cy.intercept response body is sent to Chrome
// base64-encoded in a single Fetch.fulfillRequest message. Chrome closes the
// DevTools connection on any websocket frame over 100 MiB, and in Chrome that
// connection also carries the driver's socket, so the commands after an
// oversized response never finished. Only Chrome is run: Electron stays on the
// HTTP proxy and never sends the body over CDP.
describe('cy.intercept with a response body over the CDP message limit', () => {
  const onServer = (app) => {
    app.get('/intercept_large_body/page', (req, res) => {
      res.type('html').send('<html><body><script src="/intercept_large_body/large.js"></script></body></html>')
    })

    app.get('/intercept_large_body/large.js', (req, res) => {
      res.type('application/javascript').send('window.largeScript = "origin"')
    })

    app.get('/intercept_large_body/after', (req, res) => {
      res.type('text').send('origin')
    })
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: PORT,
    }],
  })

  it('fulfills the response and keeps running the commands after it', {
    browser: 'chrome',
    config: {
      baseUrl: `http://localhost:${PORT}`,
    },
    spec: 'intercept_large_body.cy.ts',
  })
})
