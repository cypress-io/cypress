const _ = require('lodash')
const express = require('express')
const http = require('http')
const https = require('https')
const path = require('path')
const debug = require('debug')('cypress:server:network-error-handling-spec')
const Promise = require('bluebird')
const bodyParser = require('body-parser')
const DebugProxy = require('@cypress/debugging-proxy')
const launcher = require('@packages/launcher')
const chrome = require('../../lib/browsers/chrome')
const e2e = require('../support/helpers/e2e').default
const random = require('../../lib/util/random')
const Fixtures = require('../support/helpers/fixtures')
let mitmProxy = require('http-mitm-proxy')

const PORT = 13370
const PROXY_PORT = 13371
const HTTPS_PORT = 13372
const ERR_HTTPS_PORT = 13373

const start = Number(new Date())

const e2ePath = Fixtures.projectPath('e2e')

const getElapsed = () => {
  return Math.round((Number(new Date()) - start) / 1000)
}

let onVisit = null
let counts = {}

const launchBrowser = (url, opts = {}) => {
  return launcher.detect().then((browsers) => {
    const browser = _.find(browsers, { name: 'chrome' })

    const args = [
      `--user-data-dir=/tmp/cy-e2e-${random.id()}`,
    // headless breaks automatic retries
    // "--headless"
    ].concat(
      chrome._getArgs(browser),
    ).filter((arg) => {
      return ![
        // seems to break chrome's automatic retries
        '--enable-automation',
      ].includes(arg)
    })

    if (opts.withProxy) {
      args.push(`--proxy-server=http://localhost:${PORT}`)
    }

    return launcher.launch(browser, url, args)
  })
}

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

  afterHeadersReset (req, res) {
    res.writeHead(200)
    res.write('')

    return setTimeout(() => {
      return req.socket.destroy()
    }
    , 1000)
  },

  duringBodyReset (req, res) {
    res.writeHead(200)
    res.write('<html>')

    return setTimeout(() => {
      return req.socket.destroy()
    }
    , 1000)
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

  proxyInternalServerError (req, res) {
    return res.sendStatus(500)
  },

  proxyBadGateway (req, res) {
    // https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.3
    // "The server, while acting as a gateway or proxy, received an invalid response"
    return res.sendStatus(502)
  },

  proxyServiceUnavailable (req, res) {
    // https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.5.4
    // "The implication is that this is a temporary condition which will be alleviated after some delay."
    return res.sendStatus(503)
  },

  load304 (req, res) {
    return res.type('html').end('<img src="/static/javascript-logo.png"/>')
  },
}

describe('e2e network error handling', function () {
  this.timeout(240000)

  e2e.setup({
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
          app.get('/after-headers-reset', controllers.afterHeadersReset)
          app.get('/during-body-reset', controllers.duringBodyReset)
          app.get('/works-third-time/:id', controllers.worksThirdTime)
          app.get('/works-third-time-else-500/:id', controllers.worksThirdTimeElse500)
          app.post('/print-body-third-time', controllers.printBodyThirdTime)

          app.get('/load-304.html', controllers.load304)
          app.get('/load-img-net-error.html', controllers.loadImgNetError)
          app.get('/load-script-net-error.html', controllers.loadScriptNetError)
          app.get('/print-body-third-time-form', controllers.printBodyThirdTimeForm)

          return app.get('*', (req, res) => {
            // pretending we're a http proxy
            const controller = ({
              'http://immediate-reset.invalid/': controllers.immediateReset,
              'http://after-headers-reset.invalid/': controllers.afterHeadersReset,
              'http://during-body-reset.invalid/': controllers.duringBodyReset,
              'http://proxy-internal-server-error.invalid/': controllers.proxyInternalServerError,
              'http://proxy-bad-gateway.invalid/': controllers.proxyBadGateway,
              'http://proxy-service-unavailable.invalid/': controllers.proxyServiceUnavailable,
            })[req.url]

            if (controller) {
              debug('got controller for request')

              return controller(req, res)
            }

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
      baseUrl: `http://localhost:${PORT}/`,
    },
  })

  afterEach(() => {
    onVisit = null
    counts = {}
  })

  // NOTE: We can just skip these tests, they are really only useful for learning
  // about how Chrome does it.
  context.skip('Google Chrome', () => {
    const testRetries = (path) => {
      return launchBrowser(`http://127.0.0.1:${PORT}${path}`)
      .then((proc) => {
        return Promise.fromCallback((cb) => {
          return onVisit = function () {
            if (counts[path] >= 3) {
              return cb()
            }
          }
        }).then(() => {
          proc.kill(9)

          expect(counts[path]).to.be.at.least(3)
        })
      })
    }

    const testNoRetries = (path) => {
      return launchBrowser(`http://localhost:${PORT}${path}`)
      .delay(6000)
      .then((proc) => {
        proc.kill(9)

        expect(counts[path]).to.eq(1)
      })
    }

    it('retries 3+ times when receiving immediate reset', () => {
      return testRetries('/immediate-reset')
    })

    it('retries 3+ times when receiving reset after headers', () => {
      return testRetries('/after-headers-reset')
    })

    it('does not retry if reset during body', () => {
      return testNoRetries('/during-body-reset')
    })

    context('behind a proxy server', () => {
      const testProxiedRetries = (url) => {
        return launchBrowser(url, { withProxy: true })
        .then((proc) => {
          return Promise.fromCallback((cb) => {
            return onVisit = function () {
              if (counts[url] >= 3) {
                return cb()
              }
            }
          }).then(() => {
            proc.kill(9)

            expect(counts[url]).to.be.at.least(3)
          })
        })
      }

      const testProxiedNoRetries = (url) => {
        return launchBrowser('http://during-body-reset.invalid/', { withProxy: true })
        .delay(6000)
        .then((proc) => {
          proc.kill(9)

          expect(counts[url]).to.eq(1)
        })
      }

      it('retries 3+ times when receiving immediate reset', () => {
        return testProxiedRetries('http://immediate-reset.invalid/')
      })

      it('retries 3+ times when receiving reset after headers', () => {
        return testProxiedRetries('http://after-headers-reset.invalid/')
      })

      it('does not retry if reset during body', () => {
        return testProxiedNoRetries('http://during-body-reset.invalid/')
      })

      it('does not retry on \'500 Internal Server Error\'', () => {
        return testProxiedNoRetries('http://proxy-internal-server-error.invalid/')
      })

      it('does not retry on \'502 Bad Gateway\'', () => {
        return testProxiedNoRetries('http://proxy-bad-gateway.invalid/')
      })

      it('does not retry on \'503 Service Unavailable\'', () => {
        return testProxiedNoRetries('http://proxy-service-unavailable.invalid/')
      })
    })
  })

  context('Cypress', () => {
    beforeEach(() => {
      delete process.env.HTTP_PROXY
      delete process.env.HTTPS_PROXY

      return delete process.env.NO_PROXY
    })

    afterEach(function () {
      if (this.debugProxy) {
        return this.debugProxy.stop()
        .then(() => {
          this.debugProxy = null
        })
      }
    })

    it('baseurl check tries 5 times in run mode', function () {
      return e2e.exec(this, {
        config: {
          baseUrl: 'http://never-gonna-exist.invalid',
        },
        snapshot: true,
        expectedExitCode: 1,
      })
    })

    it('tests run as expected', function () {
      return e2e.exec(this, {
        spec: 'network_error_handling_spec.js',
        video: false,
        expectedExitCode: 2,
        snapshot: true,
      }).then(({ stdout }) => {
        // sometimes <img>, <script> get retried 2x by chrome instead of 1x

        if (counts['/immediate-reset?load-img'] === 10) {
          counts['/immediate-reset?load-img'] = 5
        }

        if (counts['/immediate-reset?load-js'] === 10) {
          counts['/immediate-reset?load-js'] = 5
        }

        expect(counts).to.deep.eq({
          '/immediate-reset?visit': 5,
          '/immediate-reset?request': 5,
          '/immediate-reset?load-img': 5,
          '/immediate-reset?load-js': 5,
          '/works-third-time-else-500/500-for-request': 3,
          '/works-third-time/for-request': 3,
          '/works-third-time-else-500/500-for-visit': 3,
          '/works-third-time/for-visit': 3,
          '/print-body-third-time': 3,
          '/print-body-third-time-form': 1,
          '/load-img-net-error.html': 1,
          '/load-script-net-error.html': 1,
        })
      })
    })

    it('retries HTTPS passthrough behind a proxy', function () {
      // this tests retrying multiple times
      // to connect to the upstream server
      // as well as network errors when the
      // upstream server is not accessible

      const connectCounts = {}

      const onConnect = function ({ host, port, socket }) {
        const dest = `${host}:${port}`

        if (connectCounts[dest] == null) {
          connectCounts[dest] = 0
        }

        connectCounts[dest] += 1

        switch (port) {
          case HTTPS_PORT:
            // this tests network related errors
            // when we do immediately destroy the
            // socket and prevent connecting to the
            // upstream server
            //
            // on the 3rd time around, don't destroy the socket.
            if (connectCounts[`localhost:${HTTPS_PORT}`] >= 3) {
              return true
            }

            // else if this is the 1st or 2nd time destroy the
            // socket so we retry connecting to the debug proxy
            socket.destroy()

            return false

          case ERR_HTTPS_PORT:
            // always destroy the socket attempting to connect
            // to the upstream server to test that network errors
            // are propagated correctly
            socket.destroy()

            return false

          default:
            // pass everything else on to the upstream
            // server as expected
            return true
        }
      }

      this.debugProxy = new DebugProxy({
        onConnect,
      })

      return this.debugProxy
      .start(PROXY_PORT)
      .then(() => {
        process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
        process.env.NO_PROXY = '<-loopback>' // proxy everything including localhost

        return e2e.exec(this, {
          spec: 'https_passthru_spec.js',
          snapshot: true,
        })
        .then(() => {
          console.log('connect counts are', connectCounts)

          expect(connectCounts[`localhost:${HTTPS_PORT}`]).to.be.gte(3)

          expect(connectCounts[`localhost:${ERR_HTTPS_PORT}`]).to.be.gte(4)
        })
      })
    })

    it('does not connect to the upstream proxy for the SNI server request', function () {
      const onConnect = sinon.spy(() => {
        return true
      })

      this.debugProxy = new DebugProxy({
        onConnect,
      })

      return this.debugProxy
      .start(PROXY_PORT)
      .then(() => {
        process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
        process.env.NO_PROXY = '<-loopback>,localhost:13373' // proxy everything except for the irrelevant test

        return e2e.exec(this, {
          spec: 'https_passthru_spec.js',
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

    // https://github.com/cypress-io/cypress/issues/4298
    context('does not delay a 304 Not Modified', () => {
      it('in normal network conditions', function () {
        return e2e.exec(this, {
          spec: 'network_error_304_handling_spec.js',
          video: false,
          config: {
            baseUrl: `http://localhost:${PORT}`,
            pageLoadTimeout: 4000,
          },
          snapshot: true,
        })
      })

      it('behind a proxy', function () {
        this.debugProxy = new DebugProxy()

        return this.debugProxy
        .start(PROXY_PORT)
        .then(() => {
          process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
          process.env.NO_PROXY = ''
        }).then(() => {
          return e2e.exec(this, {
            spec: 'network_error_304_handling_spec.js',
            video: false,
            config: {
              baseUrl: `http://localhost:${PORT}`,
              pageLoadTimeout: 4000,
            },
            snapshot: true,
          })
        })
      })

      it('behind a proxy with transfer-encoding: chunked', function () {
        mitmProxy = mitmProxy()

        mitmProxy.onRequest((ctx, callback) => {
          return callback()
        })

        mitmProxy.listen({
          host: '127.0.0.1',
          port: PROXY_PORT,
          keepAlive: true,
          httpAgent: http.globalAgent,
          httpsAgent: https.globalAgent,
          forceSNI: false,
          forceChunkedRequest: true,
        })

        process.env.HTTP_PROXY = `http://localhost:${PROXY_PORT}`
        process.env.NO_PROXY = ''

        return e2e.exec(this, {
          spec: 'network_error_304_handling_spec.js',
          video: false,
          config: {
            baseUrl: `http://localhost:${PORT}`,
            pageLoadTimeout: 4000,
          },
          snapshot: true,
        })
      })
    })
  })
})
