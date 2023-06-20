const _ = require('lodash')
const express = require('express')
const path = require('path')
const debug = require('debug')('cypress:server:network-error-handling-spec')
const Promise = require('bluebird')
const bodyParser = require('body-parser')
const DebugProxy = require('@cypress/debugging-proxy')
const launcher = require('@packages/launcher')
const chrome = require('@packages/server/lib/browsers/chrome')
const systemTests = require('../lib/system-tests').default
const random = require('@packages/server/lib/util/random')
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
      e2e: {
        baseUrl: `http://localhost:${PORT}/`,
      },
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

    it('tests run as expected', function () {
      return systemTests.exec(this, {
        spec: 'network_error_handling.cy.js',
        expectedExitCode: 2,
        snapshot: true,
      }).then(({ stdout }) => {
        // sometimes <img>, <script> get retried, sometimes they do not

        if (counts['/immediate-reset?load-img'] > 1) {
          console.log('load-img was retried', counts['/immediate-reset?load-img'], 'times')
          counts['/immediate-reset?load-img'] = 1
        }

        if (counts['/immediate-reset?load-js'] > 1) {
          console.log('load-js was retried', counts['/immediate-reset?load-js'], 'times')
          counts['/immediate-reset?load-js'] = 1
        }

        expect(counts).to.deep.eq({
          '/immediate-reset?visit': 5,
          '/immediate-reset?request': 5,
          '/immediate-reset?load-img': 1,
          '/immediate-reset?load-js': 1,
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

    it('does not connect to the upstream proxy for the SNI server request', function () {
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
