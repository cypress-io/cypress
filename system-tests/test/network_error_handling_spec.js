const _ = require('lodash')
const express = require('express')
const path = require('path')
const debug = require('debug')('cypress:server:network-error-handling-spec')
const bodyParser = require('body-parser')
const DebugProxy = require('@cypress/debugging-proxy')
const systemTests = require('../lib/system-tests').default
const Fixtures = require('../lib/fixtures')

const PORT = 13370
const PROXY_PORT = 13371
const HTTPS_PORT = 13372

const start = Number(new Date())

const e2ePath = Fixtures.projectPath('e2e')

const getElapsed = () => {
  return Math.round((Number(new Date()) - start) / 1000)
}

let onVisit = null
let counts = {}
let killedOnReusedSocket = 0

const servedSockets = new WeakSet()

const controllers = {
  loadScriptNetError (req, res) {
    return res.send('<script type="text/javascript" src="/immediate-reset?load-js"></script>')
  },

  loadImgNetError (req, res) {
    return res.send('<img src="/immediate-reset?load-img"/>')
  },

  printBodyThirdTimeForm (req, res) {
    return res.send(
      `\
<html>
  <body>
    <form method='POST' action='/print-body-third-time'>
      <input type='text' name='foo'/>
      <input type='submit'/>
    </form>
  </body>
</html>\
`,
    )
  },

  printBodyThirdTime (req, res) {
    console.log(req.body)

    res.type('html')

    if (counts[req.url] === 3) {
      return res.send(JSON.stringify(req.body))
    }

    return req.socket.destroy()
  },

  immediateReset (req, res) {
    return req.socket.destroy()
  },

  worksThirdTime (req, res) {
    if (counts[req.url] === 3) {
      return res.send('ok')
    }

    return req.socket.destroy()
  },

  worksThirdTimeElse500 (req, res) {
    if (counts[req.url] === 3) {
      return res.send('ok')
    }

    return res.sendStatus(500)
  },

  load304 (req, res) {
    return res.type('html').end('<img src="/static/javascript-logo.png"/>')
  },

  staleKeepAlivePage (req, res) {
    return res.type('html').end('<html><body>stale keep-alive</body></html>')
  },

  // A request on an already-served socket is met with a FIN and no response — what
  // a client sees when the origin's keep-alive timeout crosses a request in flight.
  staleSocket (req, res) {
    if (servedSockets.has(req.socket)) {
      killedOnReusedSocket++

      return req.socket.end()
    }

    servedSockets.add(req.socket)

    return res.send('ok')
  },

  staleSocketStats (req, res) {
    return res.json({ killedOnReusedSocket })
  },
}

describe('e2e network error handling', function () {
  this.timeout(240000)

  systemTests.setup({
    servers: [
      {
        onServer (app) {
          app.use((req, res, next) => {
            counts[req.url] = _.get(counts, req.url, 0) + 1

            debug('received request %o', {
              counts,
              elapsedTime: getElapsed(),
              reqUrl: req.url,
            })

            if (onVisit) {
              onVisit()
            }

            return next()
          })

          app.use('/static', express.static(path.join(e2ePath, 'static')))

          app.use(bodyParser.urlencoded({ extended: true }))

          app.get('/immediate-reset', controllers.immediateReset)
          app.get('/works-third-time/:id', controllers.worksThirdTime)
          app.get('/works-third-time-else-500/:id', controllers.worksThirdTimeElse500)
          app.post('/print-body-third-time', controllers.printBodyThirdTime)

          app.get('/load-304.html', controllers.load304)
          app.get('/stale-keepalive.html', controllers.staleKeepAlivePage)
          app.get('/stale-socket', controllers.staleSocket)
          app.get('/stale-socket-stats', controllers.staleSocketStats)
          app.get('/load-img-net-error.html', controllers.loadImgNetError)
          app.get('/load-script-net-error.html', controllers.loadScriptNetError)
          app.get('/print-body-third-time-form', controllers.printBodyThirdTimeForm)

          return app.get('*', (req, res) => {
            return res.sendStatus(404)
          })
        },

        port: PORT,
      }, {
        onServer (app) {
          app.use((req, res, next) => {
            counts[req.url] = _.get(counts, req.url, 0) + 1

            debug('received request %o', {
              counts,
              elapsedTime: getElapsed(),
              reqUrl: req.url,
            })

            if (onVisit) {
              onVisit()
            }

            return next()
          })

          return app.get('/javascript-logo.png', (req, res) => {
            const pathToJsLogo = path.join(e2ePath, 'static', 'javascript-logo.png')

            return res.sendFile(pathToJsLogo)
          })
        },

        https: true,
        port: HTTPS_PORT,
      },
    ],
    settings: {
      e2e: {
        supportFile: false,
        allowCypressEnv: false,
        baseUrl: `http://localhost:${PORT}/`,
      },
    },
  })

  afterEach(() => {
    onVisit = null
    counts = {}
  })

  context('Cypress', () => {
    let debugProxy

    beforeEach(() => {
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY

      delete process.env.NO_PROXY
    })

    afterEach(async function () {
      if (debugProxy) {
        await debugProxy.stop()
        debugProxy = null
      }
    })

    it('baseurl check tries 5 times in run mode', function () {
      return systemTests.exec(this, {
        config: {
          baseUrl: 'http://never-gonna-exist.invalid',
        },
        snapshot: true,
        expectedExitCode: 1,
      })
    })

    it('does not connect to the upstream proxy for the SNI server request', function () {
      // NOTE: the Cypress SNI/MITM server only exists when the internal proxy is
      // enabled. With CYPRESS_INTERNAL_DISABLE_PROXY=1 the browser reaches the AUT
      // directly (or via the translated upstream proxy), so this assertion does
      // not apply — covered by system-tests-*-cdp-remediated for the rest of
      // this file's disable-proxy behavior (#34351).
      if (process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1') {
        this.skip()
      }

      const onConnect = sinon.spy(() => {
        return true
      })

      debugProxy = new DebugProxy({
        onConnect,
      })

      return debugProxy
      .start(PROXY_PORT)
      .then(() => {
        process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
        process.env.NO_PROXY = '<-loopback>,localhost:13373' // proxy everything except for the irrelevant test

        return systemTests.exec(this, {
          spec: 'https_passthru.cy.js',
          snapshot: true,
          config: {
            baseUrl: `https://localhost:${HTTPS_PORT}`,
          },
        })
        .then(() => {
          expect(onConnect).to.be.calledTwice

          // 1st request: verifying base url
          expect(onConnect.firstCall).to.be.calledWithMatch({
            host: 'localhost',
            port: HTTPS_PORT,
          })

          // 2nd request: <img> load from spec
          expect(onConnect.secondCall).to.be.calledWithMatch({
            host: 'localhost',
            port: HTTPS_PORT,
          })
        })
      })
    })

    it('retries network errors for cy.visit, cy.request, and subresources', function () {
      return systemTests.exec(this, {
        spec: 'network_error_handling.cy.js',
        config: {
          baseUrl: `http://localhost:${PORT}`,
        },
        expectedExitCode: 2,
      })
    })

    // NOTE: only the Node hop replays a POST body — the browser will not replay a
    // non-idempotent request — so this holds only while Cypress proxies.
    const itReplaysFormBody = process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1' ? it.skip : it

    itReplaysFormBody('re-sends a <form> body when the origin resets the connection', function () {
      return systemTests.exec(this, {
        spec: 'network_error_form_retry.cy.js',
        config: {
          baseUrl: `http://localhost:${PORT}`,
        },
      })
    })

    // NOTE: only with the proxy disabled does the browser reach the origin
    // directly, so this contract exists solely in that mode.
    const contextStaleKeepAlive = process.env.CYPRESS_INTERNAL_DISABLE_PROXY === '1' ? context : context.skip

    contextStaleKeepAlive('stale keep-alive sockets', () => {
      beforeEach(() => {
        killedOnReusedSocket = 0
      })

      it('lets the browser recover a request written to a dead pooled socket', function () {
        return systemTests.exec(this, {
          spec: 'network_error_stale_keepalive.cy.js',
          browser: 'chrome',
          config: {
            baseUrl: `http://localhost:${PORT}`,
          },
        })
      })
    })

    // https://github.com/cypress-io/cypress/issues/4298
    context('does not delay a 304 Not Modified', () => {
      it('in normal network conditions', function () {
        return systemTests.exec(this, {
          spec: 'network_error_304_handling.cy.js',
          config: {
            pageLoadTimeout: 4000,
            baseUrl: `http://localhost:${PORT}`,
          },
          snapshot: true,
        })
      })

      it('behind a proxy', function () {
        debugProxy = new DebugProxy()

        return debugProxy
        .start(PROXY_PORT)
        .then(() => {
          process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
          process.env.NO_PROXY = ''
        }).then(() => {
          return systemTests.exec(this, {
            spec: 'network_error_304_handling.cy.js',
            config: {
              pageLoadTimeout: 4000,
              baseUrl: `http://localhost:${PORT}`,
            },
            snapshot: true,
          })
        })
      })

      it('behind a proxy with transfer-encoding: chunked', async function () {
        debugProxy = new DebugProxy({
          onRequest: (reqUrl, req, res) => {
            expect(req.headers).to.have.property('content-length')
            // delete content-length to force te: chunked
            delete req.headers['content-length']
            debugProxy._onRequest(reqUrl, req, res)
          },
        })

        process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
        process.env.NO_PROXY = ''

        await debugProxy.start(PROXY_PORT)

        await systemTests.exec(this, {
          spec: 'network_error_304_handling.cy.js',
          config: {
            pageLoadTimeout: 4000,
            baseUrl: `http://localhost:${PORT}`,
          },
          snapshot: true,
        })
      })
    })
  })
})
