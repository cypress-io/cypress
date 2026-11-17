import bodyParser from 'body-parser'
import systemTests from '../lib/system-tests'

const it = systemTests.it

const PORT = 3470

// https://github.com/cypress-io/cypress/issues/34704
//
// On the CDP network path, Chrome follows the Location the origin sent when a
// redirect is released with Fetch.continueResponse, even though the override
// shows up in its network log. A redirect whose Location a cy.intercept
// response handler changed has to be fulfilled instead. Electron stays on the
// HTTP proxy, which already applies the handler's Location.
describe('cy.intercept rewrites a redirect Location', () => {
  const onServer = (app) => {
    // The spec reaches this server as http://127.0.0.1 from a page on
    // http://localhost, so every response, redirects included, needs CORS
    // headers for a credentialed cross-site fetch.
    app.use((req, res, next) => {
      if (req.headers.origin) {
        res.set({
          'access-control-allow-origin': req.headers.origin,
          'access-control-allow-credentials': 'true',
        })
      }

      next()
    })

    const page = (text: string) => `<html><body><h1>${text}</h1></body></html>`

    // a finite event stream: one event naming the route, then the server ends it
    const events = (name: string) => {
      return (req, res) => {
        res.set({ 'content-type': 'text/event-stream', 'cache-control': 'no-cache' })
        res.write(`data: ${name}\n\n`)
        setTimeout(() => res.end(), 100)
      }
    }

    app.get('/intercept_redirect/page', (req, res) => {
      res.type('html').send('<html><body><a id="go" href="/intercept_redirect/302">go</a></body></html>')
    })

    app.get('/intercept_redirect/302', (req, res) => {
      res.redirect(302, '/intercept_redirect/original')
    })

    app.get('/intercept_redirect/302_cookie', (req, res) => {
      res.cookie('redirected', 'origin', { path: '/' })
      res.redirect(302, '/intercept_redirect/original')
    })

    app.get('/intercept_redirect/302_no_location', (req, res) => {
      res.status(302).type('html').send(page('no location'))
    })

    app.get('/intercept_redirect/original', (req, res) => {
      res.type('html').send(page('original'))
    })

    app.get('/intercept_redirect/rewritten', (req, res) => {
      res.type('html').send(page('rewritten'))
    })

    // Redirects into /302, and a target /302 can be rewritten to, so a chain
    // has an origin hop on each side of the rewritten one
    app.get('/intercept_redirect/chain', (req, res) => {
      res.redirect(302, '/intercept_redirect/302')
    })

    app.get('/intercept_redirect/to_rewritten', (req, res) => {
      res.redirect(302, '/intercept_redirect/rewritten')
    })

    for (const status of [301, 302, 303, 307, 308]) {
      app.all(`/intercept_redirect/status/${status}`, (req, res) => {
        res.redirect(status, '/intercept_redirect/echo/original')
      })
    }

    // Reports the request that arrived, so a test can tell whether a redirect
    // kept its method and body
    app.all('/intercept_redirect/echo/:name', bodyParser.text({ type: '*/*' }), (req, res) => {
      res.json({
        name: req.params.name,
        method: req.method,
        body: typeof req.body === 'string' ? req.body : '',
      })
    })

    app.get('/intercept_redirect/to_referer', (req, res) => {
      res.redirect(302, '/intercept_redirect/referer')
    })

    // Reports the Referer the followed redirect arrived with
    app.get('/intercept_redirect/referer', (req, res) => {
      res.json({ referer: req.headers.referer ?? null })
    })

    app.get('/intercept_redirect/events', (req, res) => {
      res.redirect(302, '/intercept_redirect/events_original')
    })

    app.get('/intercept_redirect/events_original', events('events_original'))
    app.get('/intercept_redirect/events_rewritten', events('events_rewritten'))
  }

  systemTests.setup({
    servers: [{
      onServer,
      port: PORT,
    }],
  })

  it('follows a redirect Location a cy.intercept response handler rewrites', {
    browser: ['chrome', 'electron'],
    config: {
      baseUrl: `http://localhost:${PORT}`,
    },
    spec: 'intercept_redirect.cy.ts',
  })
})
