require('../spec_helper')

const _ = require('lodash')
let r = require('@cypress/request')
const rp = require('@cypress/request-promise')
const compression = require('compression')
const dns = require('dns')
const express = require('express')
const http = require('http')
const url = require('url')
let zlib = require('zlib')
const str = require('underscore.string')
const evilDns = require('evil-dns')
const Promise = require('bluebird')
const { SocketE2E } = require(`../../lib/socket-e2e`)

const httpsServer = require(`@packages/https-proxy/test/helpers/https_server`)
const SseStream = require('ssestream')
const EventSource = require('eventsource')
const { setupFullConfigWithDefaults } = require('@packages/config')
const config = require(`../../lib/config`)
const { ServerBase } = require(`../../lib/server-base`)
const pluginsModule = require(`../../lib/plugins`)
const preprocessor = require(`../../lib/plugins/preprocessor`)
const resolve = require(`../../lib/util/resolve`)
const { fs } = require(`../../lib/util/fs`)
const CacheBuster = require(`../../lib/util/cache_buster`)
const Fixtures = require('@tooling/system-tests')
const { scaffoldCommonNodeModules } = require('@tooling/system-tests/lib/dep-installer')
/**
 * @type {import('@packages/resolve-dist')}
 */
const { getRunnerInjectionContents } = require(`@packages/resolve-dist`)
const { createRoutes } = require(`../../lib/routes`)
const { getCtx } = require(`../../lib/makeDataContext`)
const dedent = require('dedent')
const { unsupportedCSPDirectives } = require('@packages/proxy/lib/http/util/csp-header')

zlib = Promise.promisifyAll(zlib)

// force supertest-session to use promises provided in supertest
const session = proxyquire('supertest-session', { supertest })

const absolutePathRegex = /"\/[^{}]*?cy-projects/g
let sourceMapRegex = /\n\/\/# sourceMappingURL\=.*/

const replaceAbsolutePaths = (content) => {
  return content.replace(absolutePathRegex, '"/<path-to-project>')
}

const removeWhitespace = function (c) {
  c = str.clean(c)
  c = str.lines(c).join(' ')

  return c
}

const cleanResponseBody = (body) => {
  return replaceAbsolutePaths(removeWhitespace(body))
}

function getHugeJsFile () {
  const pathToHugeAppJs = Fixtures.path('server/libs/huge_app.js')

  const getHugeFile = () => {
    return rp('https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/huge_app.js')
    .then((resp) => {
      return fs
      .outputFileAsync(pathToHugeAppJs, resp)
      .return(resp)
    })
  }

  return fs
  .readFileAsync(pathToHugeAppJs, 'utf8')
  .catch(getHugeFile)
}

let ctx

describe('Routes', () => {
  require('mocha-banner').register()

  beforeEach(async function () {
    await scaffoldCommonNodeModules()
    ctx = getCtx()
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

    sinon.stub(CacheBuster, 'get').returns('-123')
    sinon.stub(ServerBase.prototype, 'reset')
    sinon.stub(pluginsModule, 'has').returns(false)

    nock.enableNetConnect()

    Fixtures.scaffold()

    this.setup = async (initialUrl, obj = {}, spec, shouldCorrelatePreRequests = false) => {
      if (_.isObject(initialUrl)) {
        obj = initialUrl
        initialUrl = null
      }

      if (!obj.projectRoot) {
        obj.projectRoot = Fixtures.projectPath('e2e')
      }

      await ctx.lifecycleManager.setCurrentProject(obj.projectRoot)

      // get all the config defaults
      // and allow us to override them
      // for each test
      return setupFullConfigWithDefaults(obj, getCtx().file.getFilesByGlob)
      .then((cfg) => {
        // use a jar for each test
        // but reset it automatically
        // between test
        const jar = rp.jar()

        this.r = function (options = {}, cb) {
          _.defaults(options, {
            proxy: this.proxy,
            jar,
            simple: false,
            followRedirect: false,
            resolveWithFullResponse: true,
          })

          return r(options, cb)
        }

        // use a custom request promise
        // to automatically backfill these
        // options including our proxy
        this.rp = (options = {}) => {
          let targetUrl

          if (_.isString(options)) {
            targetUrl = options
            options = {}
          }

          _.defaults(options, {
            url: targetUrl,
            proxy: this.proxy,
            jar,
            simple: false,
            followRedirect: false,
            resolveWithFullResponse: true,
          })

          return rp(options)
        }

        const open = () => {
          cfg.pluginsFile = false

          return ctx.lifecycleManager.waitForInitializeSuccess()
          .then(() => {
            return Promise.all([
            // open our https server
              httpsServer.start(8443),

              // and open our cypress server
              (this.server = new ServerBase(cfg)),

              this.server.open(cfg, {
                SocketCtor: SocketE2E,
                getSpec: () => spec,
                getCurrentBrowser: () => null,
                createRoutes,
                testingType: 'e2e',
                exit: false,
                shouldCorrelatePreRequests: () => shouldCorrelatePreRequests,
              })
              .spread(async (port) => {
                const automationStub = {
                  use: () => { },
                }

                await this.server.startWebsockets(automationStub, config, {})

                if (initialUrl) {
                  this.server.remoteStates.set(initialUrl)
                }

                this.srv = this.server.getHttpServer()

                this.session = session(this.srv)

                this.proxy = `http://localhost:${port}`

                this.networkProxy = this.server._networkProxy
              }),
            ])
          })
          .then(() => {
            ctx.lifecycleManager.setAndLoadCurrentTestingType('e2e')
          })
        }

        if (this.server) {
          return Promise.join(
            httpsServer.stop(),
            this.server.close(),
          )
          .then(open)
        }

        return open()
      })
    }
  })

  afterEach(function () {
    evilDns.clear()
    nock.cleanAll()
    this.session.destroy()
    preprocessor.close()
    this.project = null

    return Promise.join(
      this.server.close(),
      httpsServer.stop(),
      ctx.actions.project.clearCurrentProject(),
    )
    .then(() => {
      Fixtures.remove()
    })
  })

  context('GET /', () => {
    beforeEach(function () {
      return this.setup()
    })

    // this tests a situation where we open our browser in another browser
    // without proxy mode set
    it('redirects to config.clientRoute without a remote origin and without a proxy', function () {
      return this.rp({
        url: this.proxy,
        proxy: null,
      })
      .then((res) => {
        expect(res.statusCode).to.eq(302)

        expect(res.headers.location).to.eq('/__/')
      })
    })

    it('does not redirect with remote origin set', function () {
      return this.setup('http://www.github.com')
      .then(() => {
        nock(this.server.remoteStates.current().origin)
        .get('/')
        .reply(200, '<html></html>', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://www.github.com/',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('<html>')
          expect(res.body).to.include('parent.Cypress')

          expect(res.body).to.include('</html>')
        })
      })
    })

    it('does not redirect when visiting http site which isnt cypress server', function () {
      // this tests the 'default' state of cypress when a server
      // is instantiated. i noticed that before you do your first
      // cy.visit() that all http sites would redirect which is
      // incorrect. we only want the cypress port to redirect initially

      nock('http://www.momentjs.com')
      .get('/')
      .reply(200)

      return this.rp('http://www.momentjs.com/')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.headers.location).not.to.eq('/__/')
      })
    })

    it('proxies through https', function () {
      return this.setup('https://localhost:8443')
      .then(() => {
        return this.rp({
          url: 'https://localhost:8443/',
          headers: {
            'Accept': 'text/html, application/xhtml+xml, */*',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).not.to.include('Cypress')

          expect(res.body).to.include('<body>https server</body>')
        })
      })
    })
  })

  context('GET /__', () => {
    beforeEach(function () {
      return this.setup({ projectName: 'foobarbaz' })
    })

    it('routes config.clientRoute to serve cypress client app html', function () {
      return this.rp('http://localhost:2020/__')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.match(/window.__Cypress__ = true/)

        expect(res.headers['origin-agent-cluster']).to.eq('?0')
      })
    })

    it('correctly sets the "origin-agent-cluster" to opt in to setting document.domain on spec bridge iframes', function () {
      return this.rp('http://localhost:2020/__cypress/spec-bridge-iframes')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.headers['origin-agent-cluster']).to.eq('?0')
      })
    })

    it('sets title to projectName', function () {
      return this.rp('http://localhost:2020/__')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.include('<title>e2e</title>')
      })
    })

    it('omits x-powered-by', function () {
      return this.rp('http://localhost:2020/__')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.headers['x-powered-by']).not.to.exist
      })
    })

    it('proxies through https', function () {
      return this.setup('https://localhost:8443')
      .then(() => {
        return this.rp('https://localhost:8443/__')
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.match(/window.__Cypress__ = true/)
        })
      })
    })

    // TODO: no automation in unified app
    it('clientRoute routes to \'not launched through Cypress\' without a proxy set', function () {
      return this.rp({
        url: `${this.proxy}/__`,
        proxy: null,
      })
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.match(/This browser was not launched through Cypress\./)
      })
    })

    it('other URLs redirect to clientRoute without a proxy set', function () {
      // test something that isn't the clientRoute
      return this.rp({
        url: `${this.proxy}/__cypress/xhrs/foo`,
        proxy: null,
      })
      .then((res) => {
        expect(res.statusCode).to.eq(302)

        expect(res.headers['location']).to.eq('/__/')
      })
    })

    it('routes when baseUrl is set', function () {
      return this.setup({ baseUrl: 'http://localhost:9999/app' })
      .then(() => {
        return this.rp('http://localhost:9999/__')
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.match(/window.__Cypress__ = true/)
        })
      })
    })
  })

  context('GET /__cypress/runner/*', () => {
    beforeEach(function () {
      return this.setup('http://localhost:8443')
    })

    it('can get cypress_runner.js', function () {
      return this.rp('http://localhost:8443/__cypress/runner/cypress_runner.js')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.match(/React/)
      })
    })

    it('can get cypress_runner.css', function () {
      return this.rp('http://localhost:8443/__cypress/runner/cypress_runner.css')
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.match(/\.reporter/)
      })
    })
  })

  context('GET /__cypress/automation', () => {
    beforeEach(function () {
      return this.setup('http://localhost:8443')
    })

    it('sends getLocalStorage', function () {
      return this.rp(`http://localhost:8443/__cypress/automation/getLocalStorage`)
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to
        .match(/parent\.postMessage/)
        .match(/localStorage/)
        .match(/sessionStorage/)
      })
    })

    it('sends setLocalStorage', function () {
      return this.rp(`http://localhost:8443/__cypress/automation/setLocalStorage`)
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to
        .match(/parent\.postMessage/)
        .match(/set:storage/)
        .match(/localStorage/)
        .match(/sessionStorage/)
      })
    })
  })

  function pollUntilEventsIpcLoaded () {
    return new Promise((resolve) => {
      let i = 0

      const interval = setInterval(() => {
        if (ctx.lifecycleManager.isFullConfigReady) {
          clearInterval(interval)
          resolve()
        }

        i += 1

        if (i > 50) {
          throw Error(dedent`
            setupNodeEvents and plugins did not complete after 10 seconds.
            There might be an endless loop or an uncaught exception that isn't bubbling up.`)
        }
      }, 200)
    })
  }

  context('GET /__cypress/tests', () => {
    describe('ids with typescript', () => {
      beforeEach(function () {
        Fixtures.scaffold('ids')

        return this.setup({
          projectRoot: Fixtures.projectPath('ids'),
        })
      })

      it('processes foo.coffee spec', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/foo.coffee')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include('expect("foo.coffee")')
      })

      it('processes dom.jsx spec', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/baz.js')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include('React.createElement(')
      })

      it('processes spec into modern javascript', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/es6.js')

        expect(res.statusCode).to.eq(200)
        // "modern" features should remain and not be transpiled into es5
        expect(res.body).to.include('const numbers')
        expect(res.body).to.include('[...numbers]')
        expect(res.body).to.include('async function')
        expect(res.body).to.include('await Promise')
      })

      it('serves error javascript file when the file is missing', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=does/not/exist.coffee')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.include('Module not found')
        expect(res.body).to.include('Cypress.action("spec:script:error", {')
      })
    })

    describe('ids without typescript', () => {
      beforeEach(function () {
        Fixtures.scaffold('ids')

        sinon.stub(resolve, 'typescript').callsFake(() => {
          return null
        })

        return this.setup({
          projectRoot: Fixtures.projectPath('ids'),
        })
      })

      it('processes foo.coffee spec', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/foo.coffee')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include('expect("foo.coffee")')
      })

      it('processes dom.jsx spec', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/baz.js')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include('React.createElement(')
      })

      it('serves error javascript file when the file is missing', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=does/not/exist.coffee')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.include('Cypress.action("spec:script:error", {')
        expect(res.body).to.include('Module not found')
      })
    })

    describe('failures', () => {
      beforeEach(function () {
        Fixtures.scaffold('failures')

        return this.setup({
          projectRoot: Fixtures.projectPath('failures'),
          config: {
            supportFile: false,
          },
        })
      })

      it('serves error javascript file when there\'s a syntax error', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=cypress/e2e/syntax_error.js')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.include('Cypress.action("spec:script:error", {')
        expect(res.body).to.include('Unexpected token')
      })
    })

    describe('no-server', () => {
      beforeEach(function () {
        Fixtures.scaffold('no-server')

        return this.setup({
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            specPattern: 'my-tests/**/*',
            supportFile: 'helpers/includes.js',
          },
        })
      })

      it('processes my-tests/test1.js spec', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=my-tests/test1.js')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include(`expect('no-server')`)
      })

      it('processes helpers/includes.js supportFile', async function () {
        await pollUntilEventsIpcLoaded()
        const res = await this.rp('http://localhost:2020/__cypress/tests?p=helpers/includes.js')

        expect(res.statusCode).to.eq(200)
        expect(res.body).to.match(sourceMapRegex)
        expect(res.body).to.include(`console.log('includes')`)
      })
    })
  })

  context('ALL /__cypress/xhrs/*', () => {
    beforeEach(function () {
      return this.setup()
    })

    describe('delay', () => {
      it('can set delay to 10ms', function () {
        const delay = sinon.spy(Promise, 'delay')

        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-delay': '10',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(delay).to.be.calledWith(10)
        })
      })

      it('does not call Promise.delay when no delay', function () {
        const delay = sinon.spy(Promise, 'delay')

        return this.rp('http://localhost:2020/__cypress/xhrs/users/1')
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(delay).not.to.be.called
        })
      })
    })

    describe('status', () => {
      it('can set status', function () {
        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-status': '401',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(401)
        })
      })
    })

    describe('headers', () => {
      it('can set headers', function () {
        const headers = JSON.stringify({
          'x-token': '123',
          'content-type': 'text/plain',
        })

        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-headers': headers,
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/text\/plain/)

          expect(res.headers['x-token']).to.eq('123')
        })
      })

      it('sets headers from response type', function () {
        const headers = JSON.stringify({
          'x-token': '123',
        })

        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          json: true,
          headers: {
            'x-cypress-headers': headers,
            'x-cypress-response': JSON.stringify({ foo: 'bar' }),
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/application\/json/)
          expect(res.headers['x-token']).to.eq('123')

          expect(res.body).to.deep.eq({ foo: 'bar' })
        })
      })
    })

    describe('response', () => {
      it('sets response to json', function () {
        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          json: true,
          headers: {
            'x-cypress-response': JSON.stringify([1, 2, 3]),
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/application\/json/)

          expect(res.body).to.deep.eq([1, 2, 3])
        })
      })

      it('sets response to text/html', function () {
        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-response': '<html>foo</html>',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/text\/html/)

          expect(res.body).to.eq('<html>foo</html>')
        })
      })

      it('sets response to text/plain', function () {
        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-response': 'foobarbaz',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/text\/plain/)

          expect(res.body).to.eq('foobarbaz')
        })
      })

      it('sets response to text/plain on empty response', function () {
        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          headers: {
            'x-cypress-response': '',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['content-type']).to.match(/text\/plain/)

          expect(res.body).to.eq('')
        })
      })

      it('decodes responses', function () {
        const response = encodeURI(JSON.stringify({
          'test': 'We’ll',
        }))

        return this.rp({
          url: 'http://localhost:2020/__cypress/xhrs/users/1',
          json: true,
          headers: {
            'x-cypress-response': response,
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.deep.eq({ test: 'We’ll' })
        })
      })

      context('fixture', () => {
        beforeEach(function () {
          Fixtures.scaffold('todos')

          return this.setup({
            projectRoot: Fixtures.projectPath('todos'),
            config: {
              specPattern: 'tests/**/*',
              supportFile: false,
              fixturesFolder: 'tests/_fixtures',
            },
          })
        })

        it('returns fixture contents', function () {
          return this.rp({
            url: 'http://localhost:2020/__cypress/xhrs/bar',
            json: true,
            headers: {
              'x-cypress-response': 'fixture:foo',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers['content-type']).to.match(/application\/json/)

            expect(res.body).to.deep.eq([{ json: true }])
          })
        })

        it('returns __error on fixture errors', function () {
          return this.rp({
            url: 'http://localhost:2020/__cypress/xhrs/bar',
            json: true,
            headers: {
              'x-cypress-response': 'fixture:bad_json',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(400)
            expect(res.headers['content-type']).to.match(/application\/json/)

            expect(res.body.__error).to.include('\'bad_json\' is not valid JSON.')
          })
        })

        it('can change the fixture encoding', function () {
          return fs.readFileAsync(Fixtures.projectPath('todos/tests/_fixtures/images/flower.png'), 'binary')
          .then((bin) => {
            return this.rp({
              url: 'http://localhost:2020/__cypress/xhrs/bar',
              headers: {
                'x-cypress-response': 'fixture:images/flower.png,binary',
                'x-cypress-headers': JSON.stringify({
                  'content-type': 'binary/octet-stream',
                }),
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.headers['content-type']).to.include('binary/octet-stream')

              expect(res.headers['content-length']).to.eq(`${bin.length}`)
            })
          })
        })
      })

      context('PUT', () => {
        it('can issue PUT requests', function () {
          return this.rp({
            method: 'put',
            url: 'http://localhost:2020/__cypress/xhrs/users/1',
            json: true,
            body: {
              name: 'brian',
            },
            headers: {
              'x-cypress-response': JSON.stringify({ id: 123, name: 'brian' }),
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers['content-type']).to.match(/application\/json/)

            expect(res.body).to.deep.eq({ id: 123, name: 'brian' })
          })
        })
      })

      context('POST', () => {
        it('can issue POST requests', function () {
          return this.rp({
            method: 'post',
            url: 'http://localhost:2020/__cypress/xhrs/users/1',
            json: true,
            body: {
              name: 'brian',
            },
            headers: {
              'x-cypress-response': JSON.stringify({ id: 123, name: 'brian' }),
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers['content-type']).to.match(/application\/json/)

            expect(res.body).to.deep.eq({ id: 123, name: 'brian' })
          })
        })
      })

      context('HEAD', () => {
        it('can issue PUT requests', function () {
          return this.rp({
            method: 'head',
            url: 'http://localhost:2020/__cypress/xhrs/users/1',
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.headers['content-type']).to.match(/text\/plain/)
          })
        })
      })

      context('DELETE', () => {
        it('can issue DELETE requests', function () {
          return this.rp({
            method: 'delete',
            url: 'http://localhost:2020/__cypress/xhrs/users/1',
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.headers['content-type']).to.match(/text\/plain/)
          })
        })
      })
    })
  })

  // describe "maximum header size", ->
  //   ## https://github.com/cypress-io/cypress/issues/76
  //   it "does not bomb on huge headers", ->
  //     json = Fixtures.get("server/really_big_json.json")

  //     supertest(@srv)
  //       .get("/__cypress/xhrs/users")
  //       .set("x-cypress-response", json)
  //       .set("x-cypress-response-2", json)
  //       .expect(200)
  //       .expect("Content-Type", /application\/json/)
  //       .expect(JSON.parse(json))

  context('GET *', () => {
    context('basic request', () => {
      beforeEach(function () {
        return this.setup('http://www.github.com')
      })

      it('basic 200 html response', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://www.github.com/',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })
    })

    context('basic request with correlation', () => {
      beforeEach(function () {
        return this.setup('http://www.github.com', undefined, undefined, true).then(() => {
          this.networkProxy.setPreRequestTimeout(2000)
        })
      })

      it('properly correlates when CDP failures come first', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/',
        })

        this.networkProxy.removePendingBrowserPreRequest({
          requestId: '1',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('properly correlates when proxy failure come first', function () {
        this.networkProxy.setPreRequestTimeout(50)
        // If this takes longer than the Promise.delay and the prerequest timeout then the second
        // call has hit the prerequest timeout which is a problem
        this.timeout(900)

        nock(this.server.remoteStates.current().origin)
        .get('/')
        .delay(50)
        .once()
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        this.rp({
          url: 'http://www.github.com/',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
          // Timeout needs to be less than the prerequest timeout + the nock delay
          timeout: 75,
        }).catch(() => {})

        // Wait 100 ms to make sure the request times out
        return Promise.delay(100).then(() => {
          this.networkProxy.setPreRequestTimeout(1000)
          nock(this.server.remoteStates.current().origin)
          .get('/')
          .once()
          .reply(200, 'hello from baz!', {
            'Content-Type': 'text/html',
          })

          // This should not immediately correlate. If it does, then the next request will timeout
          this.networkProxy.addPendingBrowserPreRequest({
            requestId: '1',
            method: 'GET',
            url: 'http://www.github.com/',
          })

          const followupRequestPromise = this.rp({
            url: 'http://www.github.com/',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })

          return followupRequestPromise.then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('hello from baz!')
          })
        })
      })

      it('properly correlates when request has | character', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=bar|baz')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=bar|baz',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/?foo=bar|baz',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('properly correlates when request has | character with addPendingUrlWithoutPreRequest', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=bar|baz')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=bar|baz',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingUrlWithoutPreRequest('http://www.github.com/?foo=bar|baz')

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('properly correlates when request has encoded | character', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=bar%7Cbaz')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=bar%7Cbaz',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/?foo=bar%7Cbaz',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('properly correlates when request has encoded " " (space) character', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=bar%20baz')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=bar%20baz',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/?foo=bar%20baz',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('properly correlates when request has encoded " character', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=bar%22')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=bar%22',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/?foo=bar%22',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('handles malformed URIs', function () {
        this.timeout(1500)

        nock(this.server.remoteStates.current().origin)
        .get('/?foo=%A4')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        const requestPromise = this.rp({
          url: 'http://www.github.com/?foo=%A4',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })

        this.networkProxy.addPendingBrowserPreRequest({
          requestId: '1',
          method: 'GET',
          url: 'http://www.github.com/?foo=%A4',
        })

        return requestPromise.then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })
    })

    context('gzip', () => {
      beforeEach(function () {
        return this.setup('http://www.github.com')
      })

      it('unzips, injects, and then rezips initial content', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/gzip')
        .matchHeader('accept-encoding', 'gzip')
        .replyWithFile(200, Fixtures.path('server/gzip.html.gz'), {
          'Content-Type': 'text/html',
          'Content-Encoding': 'gzip',
        })

        return this.rp({
          url: 'http://www.github.com/gzip',
          gzip: true,
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('<html>')
          expect(res.body).to.include('gzip')
          expect(res.body).to.include('parent.Cypress')

          expect(res.body).to.include('</html>')
        })
      })

      it('unzips, injects, and then rezips regular http content', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/gzip')
        .matchHeader('accept-encoding', 'gzip')
        .replyWithFile(200, Fixtures.path('server/gzip.html.gz'), {
          'Content-Type': 'text/html',
          'Content-Encoding': 'gzip',
        })

        return this.rp({
          url: 'http://www.github.com/gzip',
          gzip: true,
          headers: {
            'Cookie': '__cypress.initial=false',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('<html>')
          expect(res.body).to.include('gzip')

          expect(res.body).to.include('</html>')
        })
      })

      it('does not inject on regular gzip\'d content', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/gzip')
        .matchHeader('accept-encoding', 'gzip')
        .replyWithFile(200, Fixtures.path('server/gzip.html.gz'), {
          'Content-Type': 'text/html',
          'Content-Encoding': 'gzip',
        })

        return this.rp({
          url: 'http://www.github.com/gzip',
          gzip: true,
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('<html>')
          expect(res.body).to.include('gzip')

          expect(res.body).to.include('</html>')
        })
      })

      // https://github.com/cypress-io/cypress/issues/1746
      it('can ungzip utf-8 javascript and inject without corrupting it', function () {
        let js = ''

        const app = express()

        app.use(compression({ chunkSize: 64, threshold: 1 }))

        app.get('/', (req, res) => {
          res.setHeader('content-type', 'text/javascript; charset=UTF-8')
          res.setHeader('transfer-encoding', 'chunked')

          const write = (chunk) => {
            js += chunk

            return res.write(chunk)
          }

          // note - this is unintentionally invalid JS, just try executing it anywhere
          write('function ')
          _.times(100, () => {
            return write('😡😈'.repeat(10))
          })

          write(' () { }')

          return res.end()
        })

        const server = http.createServer(app)

        return Promise.fromCallback((cb) => {
          return server.listen(12345, cb)
        }).then(() => {
          return this.rp({
            url: 'http://localhost:12345',
            gzip: true,
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.deep.eq(js)
          })
        }).finally(() => {
          return Promise.fromCallback((cb) => {
            return server.close(cb)
          })
        })
      })
    })

    context('accept-encoding', () => {
      beforeEach(function () {
        return this.setup('http://www.github.com')
      })

      it('strips unsupported deflate and br encoding', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/accept')
        .matchHeader('accept-encoding', 'gzip')
        .reply(200, '<html>accept</html>')

        return this.rp({
          url: 'http://www.github.com/accept',
          gzip: true,
          headers: {
            'accept-encoding': 'gzip,deflate,br',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.eq('<html>accept</html>')
        })
      })

      it('sets accept-encoding header to "identity" when nothing is supported', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/accept')
        .matchHeader('accept-encoding', 'identity')
        .reply(200, '<html>accept</html>')

        return this.rp({
          url: 'http://www.github.com/accept',
          gzip: true,
          headers: {
            'accept-encoding': 'foo,bar,baz',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.eq('<html>accept</html>')
        })
      })

      it('sets accept-encoding header to "gzip,identity" when no header is passed', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/accept')
        .matchHeader('accept-encoding', 'gzip,identity')
        .reply(200, '<html>accept</html>')

        return this.rp({
          url: 'http://www.github.com/accept',
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.eq('<html>accept</html>')
        })
      })
    })

    context('304 Not Modified', () => {
      beforeEach(function () {
        return this.setup('http://localhost:8080')
      })

      it('sends back a 304', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/assets/app.js')
        .reply(304)

        return this.rp({
          url: 'http://localhost:8080/assets/app.js',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(304)
        })
      })
    })

    context('redirects', () => {
      beforeEach(function () {
        return this.setup('http://getbootstrap.com')
      })

      it('passes the location header through', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/foo')
        .reply(302, undefined, {
          'Location': '/',
        })
        .get('/')
        .reply(200, '<html></html', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://getbootstrap.com/foo',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)
          expect(res.headers['set-cookie']).to.include('__cypress.initial=true; Domain=getbootstrap.com; Path=/')

          expect(res.headers['location']).to.eq('/')
        })
      })

      // this fixes improper url merge where we took query params
      // and added them needlessly
      it('doesnt redirect with query params or hashes which werent in location header', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/foo?bar=baz')
        .reply(302, undefined, {
          'Location': '/css',
        })

        return this.rp({
          url: 'http://getbootstrap.com/foo?bar=baz',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)
          expect(res.headers['set-cookie']).to.include('__cypress.initial=true; Domain=getbootstrap.com; Path=/')

          expect(res.headers['location']).to.eq('/css')
        })
      })

      it('does redirect with query params if location header includes them', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/foo?bar=baz')
        .reply(302, undefined, {
          'Location': '/css?q=search',
        })
        .get('/')
        .reply(200, '<html></html', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://getbootstrap.com/foo?bar=baz',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)
          expect(res.headers['set-cookie']).to.include('__cypress.initial=true; Domain=getbootstrap.com; Path=/')

          expect(res.headers['location']).to.eq('/css?q=search')
        })
      })

      it('does redirect with query params to external domain if location header includes them', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/foo?bar=baz')
        .reply(302, undefined, {
          'Location': 'https://www.google.com/search?q=cypress',
        })
        .get('/')
        .reply(200, '<html></html', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://getbootstrap.com/foo?bar=baz',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)
          expect(res.headers['set-cookie']).to.include('__cypress.initial=true; Domain=getbootstrap.com; Path=/')

          expect(res.headers['location']).to.eq('https://www.google.com/search?q=cypress')
        })
      })

      it('sets cookies and removes __cypress.initial when initial is originally false', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/css')
        .reply(302, undefined, {
          'Set-Cookie': 'foo=bar; Path=/',
          'Location': '/css/',
        })

        return this.rp({
          url: 'http://getbootstrap.com/css',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)
          // since this is not a cypress cookie we do not set the domain
          expect(res.headers['set-cookie']).to.deep.eq(['foo=bar; Path=/'])

          expect(res.headers['location']).to.eq('/css/')
        })
      })

      return [301, 302, 303, 307, 308].forEach((code) => {
        it(`handles direct for status code: ${code}`, function () {
          return this.setup('http://auth.example.com')
          .then(() => {
            nock(this.server.remoteStates.current().origin)
            .get('/login')
            .reply(code, undefined, {
              Location: 'http://app.example.com/users/1',
            })

            return this.rp({
              url: 'http://auth.example.com/login',
              headers: {
                'Cookie': '__cypress.initial=true',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(code)

              expect(res.headers['set-cookie']).to.include('__cypress.initial=true; Domain=example.com; Path=/')
            })
          })
        })
      })
    })

    context('error handling', () => {
      beforeEach(function () {
        return this.setup('http://www.github.com')
      })

      it('passes through status code + content', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/index.html')
        .reply(500, 'server error', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://www.github.com/index.html',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(500)
          expect(res.body).to.include('server error')

          expect(res.headers['set-cookie']).to.match(/__cypress.initial=;/)
        })
      })

      it('sends back socket hang up on request errors which match origin', function () {
        nock('http://app.github.com')
        .get('/')
        .replyWithError('ECONNREFUSED')

        return this.rp({
          url: 'http://app.github.com/',
          headers: {
            'Accept': 'text/html, application/xhtml+xml, */*',
          },
        })
        .then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.message).to.eq('Error: socket hang up')
        })
      })

      it('sends back socket hang up on actual request errors', function () {
        return this.setup('http://localhost:64644')
        .then(() => {
          return this.rp({
            url: 'http://localhost:64644',
            headers: {
              'Accept': 'text/html, application/xhtml+xml, */*',
            },
          })
        }).then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.message).to.eq('Error: socket hang up')
        })
      })

      it('sends back socket hang up on http errors when no matching origin', function () {
        return this.rp({
          url: 'http://localhost:64644',
          headers: {
            'Accept': 'text/html, application/xhtml+xml, */*',
          },
        })
        .then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.message).to.eq('Error: socket hang up')
        })
      })

      it('sends back 401 when file server does not receive correct auth', function () {
        return this.setup('<root>', {
          config: {
            fileServerFolder: '/Users/bmann/Dev/projects',
          },
        })
        .then(() => {
          return rp(`http://localhost:${this.server._fileServer.port()}/foo/views/test/index.html`, {
            resolveWithFullResponse: true,
            simple: false,
          })
        }).then((res) => {
          expect(res.statusCode).to.eq(401)
        })
      })

      it('sends back 404 when file does not exist locally', function () {
        return this.setup('<root>', {
          config: {
            fileServerFolder: '/Users/bmann/Dev/projects',
          },
        })
        .then(() => {
          return this.rp({
            url: `${this.proxy}/foo/views/test/index.html`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(404)
            expect(res.body).to.include('Cypress errored trying to serve this file from your system:')
            expect(res.body).to.include('/Users/bmann/Dev/projects/foo/views/test/index.html')
            expect(res.body).to.include('The file was not found.')
            expect(res.body).to.include('<html>\n<head> <script')
            expect(res.body).to.include('</script> </head> <body>')
          })
        })
      }) // should continue to inject

      it('does not inject on file server errors when origin does not match', function () {
        return this.setup('<root>', {
          config: {
            fileServerFolder: '/Users/bmann/Dev/projects',
          },
        })
        .then(() => {
          nock('http://www.github.com')
          .get('/index.html')
          .reply(500, 'server error', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.github.com/index.html',
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(500)

            expect(res.body).to.eq('server error')
          })
        })
      })

      it('transparently proxies decoding gzip failures', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/index.html')
        .replyWithFile(200, Fixtures.path('server/gzip-bad.html.gz'), {
          'Content-Type': 'text/html',
          'Content-Encoding': 'gzip',
        })

        return this.rp({
          url: 'http://www.github.com/index.html',
          headers: {
            'Accept': 'text/html, application/xhtml+xml, */*',
          },
          gzip: true,
        })
        .then(() => {
          throw new Error('should not reach')
        }).catch((err) => {
          expect(err.error.code).to.eq('ECONNRESET')
        })
      })
    })

    context('headers', () => {
      beforeEach(function () {
        return this.setup('http://localhost:8080')
      })

      describe('when unload is true', () => {
        it('automatically redirects back to clientRoute', function () {
          return this.rp({
            url: 'http://localhost:8080/_',
            headers: {
              'Cookie': '__cypress.unload=true; __cypress.initial=true',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(302)

            expect(res.headers['location']).to.eq('/__/')
          })
        })
      })

      describe('when initial is true', () => {
        it('sets back to false', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/app.html')
          .reply(200, 'OK', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://localhost:8080/app.html',
            headers: {
              'Cookie': '__cypress.initial=true',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.headers['set-cookie']).to.match(/initial=;/)
          })
        })
      })

      describe('when initial is false', () => {
        it('does not reset initial or remoteHost', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/app.html')
          .reply(200, 'OK', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://localhost:8080/app.html',
            headers: {
              'Cookie': '__cypress.initial=false',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            // there shouldnt be any cookies set here by us
            expect(res.headers['set-cookie']).not.to.exist
          })
        })
      })

      it('sends with Transfer-Encoding: chunked without Content-Length', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/login')
        .reply(200, Buffer.from('foo'), {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://localhost:8080/login',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('foo')
          expect(res.headers['transfer-encoding']).to.eq('chunked')

          expect(res.headers).not.to.have.property('content-length')
        })
      })

      it('does not have Content-Length', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/login')
        .reply(200, 'foo', {
          'Content-Type': 'text/html',
          'Content-Length': 123,
        })

        return this.rp({
          url: 'http://localhost:8080/login',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('foo')
          expect(res.headers['transfer-encoding']).to.eq('chunked')

          expect(res.headers).not.to.have.property('content-length')
        })
      })

      it('forwards cookies from incoming responses', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/login')
        .reply(200, 'OK', {
          'set-cookie': 'userId=123',
        })

        return this.rp({
          url: 'http://localhost:8080/login',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers['set-cookie']).to.match(/userId=123/)
        })
      })

      it('appends to previous cookies from incoming responses', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/login')
        .reply(200, '<html></html>', {
          'set-cookie': 'userId=123; Path=/',
          'content-type': 'text/html',
        })

        return this.rp({
          url: 'http://localhost:8080/login',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          const setCookie = res.headers['set-cookie']

          expect(setCookie[0]).to.eq('userId=123; Path=/')

          expect(setCookie[1]).to.eq('__cypress.initial=; Domain=localhost; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT')
        })
      })

      it('appends cookies on redirects', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/login')
        .reply(302, undefined, {
          'location': '/dashboard',
          'set-cookie': 'userId=123; Path=/',
        })

        return this.rp({
          url: 'http://localhost:8080/login',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(302)

          expect(res.headers['location']).to.eq('/dashboard')

          expect(res.headers['set-cookie']).to.deep.eq([
            'userId=123; Path=/',
            '__cypress.initial=true; Domain=localhost; Path=/',
          ])
        })
      })

      it('passes invalid cookies', function (done) {
        nock(this.server.remoteStates.current().origin)
        .get('/invalid')
        .reply(200, 'OK', {
          'set-cookie': [
            'foo=bar; Path=/',
            '___utmvmXluIZsM=fidJKOsDSdm; path=/; Max-Age=900',
            '___utmvbXluIZsM=bZM\n    XtQOGalF: VtR; path=/; Max-Age=900',
          ],
        })

        http.get('http://localhost:8080/invalid', (res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers['set-cookie']).to.deep.eq([
            'foo=bar; Path=/',
            '___utmvmXluIZsM=fidJKOsDSdm; path=/; Max-Age=900',
            '___utmvbXluIZsM=bZM\n    XtQOGalF: VtR; path=/; Max-Age=900',
          ])

          done()
        })
      })

      it('forwards other headers from incoming responses', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/auth')
        .reply(200, 'OK', {
          'x-token': 'abc-123',
        })

        return this.rp({
          url: 'http://localhost:8080/auth',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers['x-token']).to.eq('abc-123')
        })
      })

      it('forwards headers to outgoing requests', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .matchHeader('x-custom', 'value')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://localhost:8080/bar',
          headers: {
            'Cookie': '__cypress.initial=true',
            'x-custom': 'value',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.include('hello from bar!')
        })
      })

      it('omits x-frame-options', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, 'OK', {
          'Content-Type': 'text/html',
          'x-frame-options': 'SAMEORIGIN',
        })

        return this.rp('http://localhost:8080/bar')
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers).not.to.have.property('x-frame-options')
        })
      })

      it('omits content-security-policy by default', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, 'OK', {
          'Content-Type': 'text/html',
          'content-security-policy': 'foobar;',
        })

        return this.rp({
          url: 'http://localhost:8080/bar',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers).not.to.have.property('content-security-policy')
        })
      })

      it('omits content-security-policy-report-only by default', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, 'OK', {
          'Content-Type': 'text/html',
          'content-security-policy-report-only': 'foobar;',
        })

        return this.rp({
          url: 'http://localhost:8080/bar',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers).not.to.have.property('content-security-policy-report-only')
        })
      })

      it('omits document-domain from Feature-Policy header', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, 'OK', {
          'Content-Type': 'text/html',
          'Feature-Policy': 'camera *; document-domain \'none\'; autoplay \'self\'',
        })

        return this.rp({
          url: 'http://localhost:8080/bar',
          headers: {
            'Cookie': '__cypress.initial=false',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.headers['feature-policy']).to.include('camera *')
          expect(res.headers['feature-policy']).to.include('autoplay \'self\'')

          expect(res.headers['feature-policy']).not.to.include('document-domain \'none\'')
        })
      })

      it('does not modify host origin header', function () {
        return this.setup('http://foobar.com')
        .then(() => {
          nock(this.server.remoteStates.current().origin)
          .get('/css')
          .matchHeader('host', 'foobar.com')
          .reply(200)

          return this.rp({
            url: 'http://foobar.com/css',
            headers: {
              'Cookie': '__cypress.initial=false',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })
      })

      it('does not cache when initial response', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://localhost:8080/',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers['cache-control']).to.eq('no-cache, no-store, must-revalidate')
        })
      })

      it('does cache requesting resource without injection', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/')
        .reply(200, 'hello from bar!', {
          'Content-Type': 'text/plain',
          'Cache-Control': 'max-age=86400',
        })

        return this.rp('http://localhost:8080/')
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.headers['cache-control']).to.eq('max-age=86400')
        })
      })

      it('forwards origin header', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/foo')
        .matchHeader('host', 'localhost:8080')
        .matchHeader('origin', 'http://localhost:8080')
        .reply(200, '<html>origin</html>', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://localhost:8080/foo',
          headers: {
            'Cookie': '__cypress.initial=false',
            'Origin': 'http://localhost:8080',
            'Accept': 'text/html, application/xhtml+xml, */*',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
          expect(res.body).to.include('origin')

          expect(res.body).not.to.include('Cypress')
        })
      })

      it('issue #222 - correctly sets http host headers', function () {
        const matches = (url, fn) => {
          return this.setup(url)
          .then(() => {
            this.server.onRequest(fn)

            return this.rp({
              url,
              headers: {
                'Accept-Encoding': 'identity',
              },
            })
          }).then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq('{}')
          })
        }

        return matches('http://localhost:8080/app.css', () => {
          return nock('http://localhost:8080')
          .matchHeader('host', 'localhost:8080')
          .get('/app.css')
          .reply(200, '{}', {
            'Content-Type': 'text/css',
          })
        }).then(() => {
          return matches('http://127.0.0.1/app.css', () => {
            return nock('http://127.0.0.1')
            .matchHeader('host', '127.0.0.1')
            .get('/app.css')
            .reply(200, '{}', {
              'Content-Type': 'text/css',
            })
          })
        }).then(() => {
          return matches('http://127.0.0.1:80/app2.css', () => {
            return nock('http://127.0.0.1:80')
            .matchHeader('host', '127.0.0.1')
            .get('/app2.css')
            .reply(200, '{}', {
              'Content-Type': 'text/css',
            })
          })
        }).then(() => {
          return matches('https://www.google.com:443/app.css', () => {
            return nock('https://www.google.com')
            .matchHeader('host', 'www.google.com')
            .get('/app.css')
            .reply(200, '{}', {
              'Content-Type': 'text/css',
            })
          })
        }).then(() => {
          return matches('https://www.apple.com/app.css', () => {
            return nock('https://www.apple.com')
            .matchHeader('host', 'www.apple.com')
            .get('/app.css')
            .reply(200, '{}', {
              'Content-Type': 'text/css',
            })
          })
        })
      })

      describe('CSP Header', () => {
        describe('provided', () => {
          describe('experimentalCspAllowList: false', () => {
            beforeEach(function () {
              return this.setup('http://localhost:8080', {
                config: {
                  experimentalCspAllowList: false,
                },
              })
            })

            it('strips all CSP headers for text/html content-type when "experimentalCspAllowList" is false', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).not.to.have.property('content-security-policy')
              })
            })
          })

          describe('experimentalCspAllowList: true', () => {
            beforeEach(function () {
              return this.setup('http://localhost:8080', {
                config: {
                  experimentalCspAllowList: true,
                },
              })
            })

            it('does not append a "script-src" nonce to CSP header for text/html content-type when no valid directive exists', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'$/)
              })
            })
          })

          describe('experimentalCspAllowList: ["script-src-element", "script-src", "default-src"]', () => {
            beforeEach(function () {
              return this.setup('http://localhost:8080', {
                config: {
                  experimentalCspAllowList: ['script-src-elem', 'script-src', 'default-src'],
                },
              })
            })

            it('appends a nonce to existing CSP header directive "script-src-elem" for text/html content-type when in CSP header', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'; script-src-elem \'fake-src\';',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'; script-src-elem 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}';$/)
              })
            })

            it('appends a nonce to existing CSP header directive "script-src" for text/html content-type when in CSP header', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'; script-src \'fake-src\';',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'; script-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}';$/)
              })
            })

            it('appends a nonce to existing CSP header directive "default-src" for text/html content-type when in CSP header', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'; default-src \'fake-src\';',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'; default-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}';$/)
              })
            })

            it('appends a nonce to both CSP header directive "script-src" and "default-src" for text/html content-type when in CSP header when both exist', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'; script-src \'fake-src\'; default-src \'fake-src\';',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'; script-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'; default-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}';$/)
              })
            })

            it('appends a nonce to all valid CSP header directives for text/html content-type when in CSP header', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'; script-src-elem \'fake-src\'; script-src \'fake-src\'; default-src \'fake-src\';',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'; script-src-elem 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'; script-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'; default-src 'fake-src' 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}';$/)
              })
            })

            it('does not remove original CSP header for text/html content-type', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'text/html',
                'content-security-policy': 'foo \'bar\'',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/foo 'bar'/)
              })
            })

            it('does not append a nonce to CSP header if request is not for html', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'application/json',
                'content-security-policy': 'foo \'bar\'',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).not.to.match(/script-src 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'/)
              })
            })

            it('does not remove original CSP header if request is not for html', function () {
              nock(this.server.remoteStates.current().origin)
              .get('/bar')
              .reply(200, 'OK', {
                'Content-Type': 'application/json',
                'content-security-policy': 'foo \'bar\'',
              })

              return this.rp({
                url: 'http://localhost:8080/bar',
                headers: {
                  'Cookie': '__cypress.initial=false',
                },
              })
              .then((res) => {
                expect(res.statusCode).to.eq(200)
                expect(res.headers).to.have.property('content-security-policy')
                expect(res.headers['content-security-policy']).to.match(/^foo 'bar'$/)
              })
            })

            // The following directives are not supported by Cypress and should be stripped
            unsupportedCSPDirectives.forEach((directive) => {
              const headerValue = `${directive} 'none'`

              it(`removes the "${directive}" CSP directive for text/html content-type`, function () {
                nock(this.server.remoteStates.current().origin)
                .get('/bar')
                .reply(200, 'OK', {
                  'Content-Type': 'text/html',
                  'content-security-policy': `foo \'bar\'; ${headerValue};`,
                })

                return this.rp({
                  url: 'http://localhost:8080/bar',
                  headers: {
                    'Cookie': '__cypress.initial=false',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  },
                })
                .then((res) => {
                  expect(res.statusCode).to.eq(200)
                  expect(res.headers).to.have.property('content-security-policy')
                  expect(res.headers['content-security-policy']).to.match(/^foo 'bar'/)
                  expect(res.headers['content-security-policy']).not.to.match(new RegExp(headerValue))
                })
              })
            })
          })
        })

        describe('not provided', () => {
          it('does not append a nonce to CSP header for text/html content-type', function () {
            nock(this.server.remoteStates.current().origin)
            .get('/bar')
            .reply(200, 'OK', {
              'Content-Type': 'text/html',
            })

            return this.rp({
              url: 'http://localhost:8080/bar',
              headers: {
                'Cookie': '__cypress.initial=false',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.headers).not.to.have.property('content-security-policy')
            })
          })

          it('does not append a nonce to CSP header if request is not for html', function () {
            nock(this.server.remoteStates.current().origin)
            .get('/bar')
            .reply(200, 'OK', {
              'Content-Type': 'application/json',
            })

            return this.rp({
              url: 'http://localhost:8080/bar',
              headers: {
                'Cookie': '__cypress.initial=false',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.headers).not.to.have.property('content-security-policy')
            })
          })
        })
      })

      context('authorization', () => {
        it('attaches auth headers when matches origin', function () {
          const username = 'u'
          const password = 'p'

          const base64 = Buffer.from(`${username}:${password}`).toString('base64')

          this.server.remoteStates.set('http://localhost:8080', {
            auth: {
              username,
              password,
            },
          })

          nock('http://localhost:8080')
          .get('/index')
          .matchHeader('authorization', `Basic ${base64}`)
          .reply(200, '')

          return this.rp('http://localhost:8080/index')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })

        it('does not attach auth headers when not matching origin', function () {
          nock('http://localhost:8080', {
            badheaders: ['authorization'],
          })
          .get('/index')
          .reply(200, '')

          return this.rp('http://localhost:8080/index')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })

        it('does not modify existing auth headers when matching origin', function () {
          const existing = 'Basic asdf'

          this.server.remoteStates.set('http://localhost:8080', {
            auth: {
              username: 'u',
              password: 'p',
            },
          })

          nock('http://localhost:8080')
          .get('/index')
          .matchHeader('authorization', existing)
          .reply(200, '')

          return this.rp({
            url: 'http://localhost:8080/index',
            headers: {
              'Authorization': existing,
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })

        // https://github.com/cypress-io/cypress/issues/4267
        it(`doesn't attach auth headers to a diff protection space on the same origin`, function () {
          return this.setup('http://beta.something.com')
          .then(() => {
            const username = 'u'
            const password = 'p'

            const base64 = Buffer.from(`${username}:${password}`).toString('base64')

            this.server.remoteStates.set('http://beta.something.com', {
              auth: {
                username,
                password,
              },
            })

            nock(/.*\.something.com/)
            .get('/index')
            .matchHeader('authorization', `Basic ${base64}`)
            .reply(200, '')
            .get('/index')
            .matchHeader('authorization', _.isUndefined)
            .reply(200, '')

            return this.rp('http://beta.something.com/index')
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              return this.rp('http://cdn.something.com/index')
            }).then((res) => {
              expect(res.statusCode).to.eq(200)
            })
          })
        })
      })
    })

    context('images', () => {
      beforeEach(() => {
        return Fixtures.scaffold()
      })

      it('passes the bytes through without injection on http servers', function () {
        const image = Fixtures.projectPath('e2e/static/javascript-logo.png')

        return Promise.all([
          fs.statAsync(image).get('size'),
          fs.readFileAsync(image, 'utf8'),
          this.setup('http://localhost:8881'),
        ])
        .spread((size, bytes, setup) => {
          nock(this.server.remoteStates.current().origin)
          .get('/javascript-logo.png')
          .replyWithFile(200, image, {
            'Content-Type': 'image/png',
          })

          return this.rp({
            url: 'http://localhost:8881/javascript-logo.png',
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).not.to.include('<script')

            expect(res.body).to.eq(bytes)
          })
        })
      })

      it('passes the bytes through without injection on http servers with gzip', function () {
        const image = Fixtures.projectPath('e2e/static/javascript-logo.png')
        const zipped = Fixtures.projectPath('e2e/static/javascript-logo.png.gz')

        return Promise.all([
          fs.statAsync(image).get('size'),
          fs.readFileAsync(image, 'utf8'),
          this.setup('http://localhost:8881'),
        ])
        .spread((size, bytes, setup) => {
          nock(this.server.remoteStates.current().origin)
          .get('/javascript-logo.png')
          .replyWithFile(200, zipped, {
            'Content-Type': 'image/png',
            'Content-Encoding': 'gzip',
          })

          return this.rp({
            url: 'http://localhost:8881/javascript-logo.png',
            gzip: true,
            headers: {
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).not.to.include('<script')

            expect(res.body).to.eq(bytes)
          })
        })
      })
    })

    context('woff', () => {
      beforeEach(() => {
        return Fixtures.scaffold()
      })

      it('passes the bytes through without injection', function () {
        const font = Fixtures.projectPath('e2e/static/FiraSans-Regular.woff')

        return Promise.all([
          fs.statAsync(font).get('size'),
          fs.readFileAsync(font, 'utf8'),
          this.setup('http://localhost:8881'),
        ])
        .spread((size, bytes, setup) => {
          nock(this.server.remoteStates.current().origin)
          .get('/font.woff')
          .replyWithFile(200, font, {
            'Content-Type': 'application/font-woff; charset=utf-8',
          })

          return this.rp({
            url: 'http://localhost:8881/font.woff',
            headers: {
              'Accept': '*/*',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).not.to.include('<script')

            expect(res.body).to.eq(bytes)
          })
        })
      })
    })

    context('svg', () => {
      beforeEach(function () {
        return this.setup('http://www.google.com')
      })

      it('rewrites <svg> without hanging', function () {
        // if this test finishes without timing out we know its all good
        const contents = removeWhitespace(Fixtures.get('server/err_response.html'))

        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, contents, {
          'Content-Type': 'text/html; charset=utf-8',
        })

        return this.rp({
          url: 'http://www.google.com/bar',
          headers: {
            'Cookie': '__cypress.initial=true',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)
        })
      })
    })

    context('content injection', () => {
      describe('without config.injectDocumentDomain enabled', function () {
        beforeEach(function () {
          return this.setup('http://www.cypress.io')
        })

        it('injects when head has attributes', async function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<html> <head prefix="og: foo"> <meta name="foo" content="bar"> </head> <body>hello from bar!</body> </html>', {
            'Content-Type': 'text/html',
          })

          const injection = await getRunnerInjectionContents()
          const contents = removeWhitespace(Fixtures.get('server/expected_head_inject.html').replace('{{injection}}', injection))
          const res = await this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          const body = cleanResponseBody(res.body)

          expect(res.statusCode).to.eq(200)
          expect(body).to.eq(contents)
        })

        it('injects even when head tag is missing', async function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<html> <body>hello from bar!</body> </html>', {
            'Content-Type': 'text/html',
          })

          const injection = await getRunnerInjectionContents()
          const contents = removeWhitespace(Fixtures.get('server/expected_no_head_tag_inject.html').replace('{{injection}}', injection))

          const res = await this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          const body = cleanResponseBody(res.body)

          expect(res.statusCode).to.eq(200)
          expect(body).to.eq(contents)
        })

        it('injects when head is capitalized', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<HTML> <HEAD>hello from bar!</HEAD> </HTML>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('<HTML> <HEAD>')
            expect(res.body).to.include('Cypress=parent.Cypress')
          })
        })

        it('injects when head missing but has <header>', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<html> <body><nav>some nav</nav><header>header</header></body> </html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('<html> <head>')
            expect(res.body).to.include('Cypress=parent.Cypress')
            expect(res.body).to.include('</head> <body><nav>some nav</nav><header>header</header></body> </html>')
          })
        })

        it('injects when body is capitalized', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<HTML> <BODY>hello from bar!</BODY> </HTML>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('Cypress=parent.Cypress')
            expect(res.body).to.include('</script> </head> <BODY>hello from bar!</BODY> </HTML>')
          })
        })

        it('injects when both head + body are missing', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<HTML>hello from bar!</HTML>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('Cypress=parent.Cypress')
            expect(res.body).to.include('<HTML> <head> <script')

            expect(res.body).to.include('</head>hello from bar!</HTML>')
          })
        })

        it('injects even when html + head + body are missing', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<div>hello from bar!</div>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('<head>')
            expect(res.body).to.include('Cypress=parent.Cypress')

            expect(res.body).to.include('</head><div>hello from bar!</div>')
          })
        })

        it('injects after DOCTYPE declaration when no other content', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<!DOCTYPE>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('<!DOCTYPE><head> <script')
            expect(res.body).to.include('Cypress=parent.Cypress')
          })
        })

        it('injects content after following redirect', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(302, undefined, {
            // redirect us to google.com!
            'Location': 'http://www.cypress.io/foo',
          })

          nock(this.server.remoteStates.current().origin)
          .get('/foo')
          .reply(200, '<html> <head prefix="og: foo"> <title>foo</title> </head> <body>hello from bar!</body> </html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(302)
            expect(res.headers['location']).to.eq('http://www.cypress.io/foo')
            expect(res.headers['set-cookie']).to.match(/initial=true/)

            return this.rp({
              url: res.headers['location'],
              headers: {
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.headers['set-cookie']).to.match(/initial=;/)

              expect(res.body).to.include('parent.Cypress')
            })
          })
        })

        it('injects performantly on a huge amount of elements over http', function () {
          Fixtures.scaffold()

          nock(this.server.remoteStates.current().origin)
          .get('/elements.html')
          .replyWithFile(200, Fixtures.projectPath('e2e/elements.html'), {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/elements.html',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('Cypress=parent.Cypress')
          })
        })

        it('injects performantly on a huge amount of elements over file', function () {
          Fixtures.scaffold()

          return this.setup('/index.html', {
            projectRoot: Fixtures.projectPath('e2e'),
          })
          .then(() => {
            return this.rp({
              url: `${this.proxy}/elements.html`,
              headers: {
                'Cookie': '__cypress.initial=true',
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.include('Cypress=parent.Cypress')
            })
          })
        })

        it('does not inject when not initial and not html', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<html><head></head></html>', {
            'Content-Type': 'text/plain',
          })

          return this.rp({
            url: 'http://www.cypress.io/bar',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).not.to.include('Cypress=parent.Cypress')
          })
        })

        it('injects into https server', async function () {
          await this.setup('https://localhost:8443')

          const injection = await getRunnerInjectionContents()
          const contents = removeWhitespace(Fixtures.get('server/expected_https_inject.html').replace('{{injection}}', injection))
          const res = await this.rp({
            url: 'https://localhost:8443/',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          const body = cleanResponseBody(res.body)

          expect(res.statusCode).to.eq(200)
          expect(body).to.eq(contents)
        })

        it('injects into https://www.google.com', function () {
          return this.setup('https://www.google.com')
          .then(() => {
            this.server.onRequest((req, res) => {
              return nock('https://www.google.com')
              .get('/')
              .reply(200, '<html><head></head><body>google</body></html>', {
                'Content-Type': 'text/html',
              })
            })

            return this.rp({
              url: 'https://www.google.com/',
              headers: {
                'Cookie': '__cypress.initial=true',
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.include('parent.Cypress')
            })
          })
        })

        it('injects even on 5xx responses', function () {
          return this.setup('https://www.cypress.io')
          .then(() => {
            this.server.onRequest((req, res) => {
              return nock('https://www.cypress.io')
              .get('/')
              .reply(500, '<html><head></head><body>google</body></html>', {
                'Content-Type': 'text/html',
              })
            })

            return this.rp({
              url: 'https://www.cypress.io/',
              headers: {
                'Accept': 'text/html, application/xhtml+xml, */*',
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(500)

              expect(res.body).to.include('<html><head> <script type=\'text/javascript\'>')
            })
          })
        })

        it('works with host swapping', async function () {
          await this.setup('https://www.foobar.com:8443')
          evilDns.add('*.foobar.com', '127.0.0.1')

          const injection = await getRunnerInjectionContents()
          const contents = removeWhitespace(Fixtures.get('server/expected_https_inject.html').replace('{{injection}}', injection))
          const res = await this.rp({
            url: 'https://www.foobar.com:8443/index.html',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          const body = cleanResponseBody(res.body)

          expect(res.statusCode).to.eq(200)
          expect(body).to.eq(contents.replace('localhost', 'foobar.com'))
        })
      })

      describe('with config.injectDocumentDomain enabled', function () {
        const config = {
          injectDocumentDomain: true,
          testingType: 'e2e',
        }
        const superdomain = 'cypress.io'
        const origin = 'http://www.cypress.io'

        beforeEach(function () {
          return this.setup(origin, {
            config,
          })
        })

        it('injects superdomain even when head tag is missing', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/bar')
          .reply(200, '<html> <body>hello from bar!</body> </html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: `${origin}/bar`,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include(`document.domain = \'${superdomain}\'`)
          })
        })

        it('continues to inject on the same https superdomain but different subdomain', async function () {
          await this.setup('https://www.foobar.com:8443', { config })
          evilDns.add('*.foobar.com', '127.0.0.1')

          const injection = await getRunnerInjectionContents()
          const contents = removeWhitespace(Fixtures.get('server/expected_https_inject_document_domain.html').replace('{{injection}}', injection))
          const res = await this.rp({
            url: 'https://docs.foobar.com:8443/index.html',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          const body = cleanResponseBody(res.body)

          expect(res.statusCode).to.eq(200)
          expect(body).to.eq(contents.replace('localhost', 'foobar.com'))
        })

        it('injects document.domain on https requests to same superdomain but different subdomain', function () {
          return this.setup('https://www.foobar.com:8443', { config })
          .then(() => {
            evilDns.add('*.foobar.com', '127.0.0.1')

            return this.rp({
              url: 'https://docs.foobar.com:8443/index.html',
              headers: {
                'Cookie': '__cypress.initial=false',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              const body = cleanResponseBody(res.body)

              expect(body).to.eq('<html><head> <script type=\'text/javascript\'> document.domain = \'foobar.com\'; </script></head><body>https server</body></html>')
            })
          })
        })

        it('injects document.domain on other http requests', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/iframe')
          .reply(200, '<html><head></head></html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/iframe',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            const body = cleanResponseBody(res.body)

            expect(body).to.eq('<html><head> <script type=\'text/javascript\'> document.domain = \'cypress.io\'; </script></head></html>')
          })
        })

        it('does not inject document.domain on matching super domains but different subdomain - when the domain is set to strict same origin (google)', function () {
          nock('http://www.google.com')
          .get('/iframe')
          .reply(200, '<html><head></head></html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.google.com/iframe',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            const body = cleanResponseBody(res.body)

            expect(body).to.eq('<html><head></head></html>')
          })
        })

        it('injects document.domain on AUT iframe requests that do not match current superDomain', function () {
          nock('http://www.foobar.com')
          .get('/')
          .reply(200, '<html><head></head><body>hi</body></html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.foobar.com',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'X-Cypress-Is-AUT-Frame': 'true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            const body = cleanResponseBody(res.body)

            expect(body).to.include(`<html><head> <script type='text/javascript'> document.domain = 'foobar.com';`)
          })
        })

        it('does not inject document.domain on non http requests', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/json')
          .reply(200, {
            foo: '<html><head></head></html>',
          })

          return this.rp({
            url: 'http://www.cypress.io/json',
            json: true,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.deep.eq({ foo: '<html><head></head></html>' })
          })
        })

        it('does not inject document.domain on http requests which do not match current superDomain and are not the AUT iframe', function () {
          nock('http://www.foobar.com')
          .get('/')
          .reply(200, '<html><head></head><body>hi</body></html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.foobar.com',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq('<html><head></head><body>hi</body></html>')
          })
        })

        it('does not inject anything when not text/html response content-type even when __cypress.initial=true', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/json')
          .reply(200, { foo: 'bar' })

          return this.rp({
            url: 'http://www.cypress.io/json',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept': 'application/json',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.eq(JSON.stringify({ foo: 'bar' }))

            // it should not be telling us to turn this off either
            expect(res.headers['set-cookie']).not.to.match(/initial/)
          })
        })

        it('does not inject into x-requested-with request headers', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/iframe')
          .reply(200, '<html><head></head></html>', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.cypress.io/iframe',
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
              'X-Requested-With': 'XMLHttpRequest',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            const body = cleanResponseBody(res.body)

            expect(body).to.eq('<html><head></head></html>')
          })
        })

        context('content injection', () => {
          beforeEach(function () {
            return this.setup('http://www.foo.com', { config })
          })

          it('injects document.domain on matching super domains but different subdomain - non google domain', function () {
            nock('http://mail.foo.com')
            .get('/iframe')
            .reply(200, '<html><head></head></html>', {
              'Content-Type': 'text/html',
            })

            return this.rp({
              url: 'http://mail.foo.com/iframe',
              headers: {
                'Cookie': '__cypress.initial=false',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Encoding': 'identity',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              const body = cleanResponseBody(res.body)

              expect(body).to.eq('<html><head> <script type=\'text/javascript\'> document.domain = \'foo.com\'; </script></head></html>')
            })
          })
        })

        ;['text/html', 'application/xhtml+xml', 'text/plain, application/xhtml+xml', '', null].forEach((type) => {
          it(`does not inject unless both text/html and application/xhtml+xml is requested: tried to accept: ${type}`, function () {
            nock(this.server.remoteStates.current().origin)
            .get('/iframe')
            .reply(200, '<html><head></head></html>', {
              'Content-Type': 'text/html',
            })

            const headers = {
              'Cookie': '__cypress.initial=false',
              'Accept-Encoding': 'identity',
            }

            headers['Accept'] = type

            return this.rp({
              url: 'http://www.cypress.io/iframe',
              headers,
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              const body = cleanResponseBody(res.body)

              expect(body).to.eq('<html><head></head></html>')
            })
          })
        })
      })
    })

    context('security rewriting', () => {
      describe('on by default', () => {
        beforeEach(function () {
          return this.setup('http://www.google.com')
        })

        it('replaces obstructive code in HTML files', function () {
          const html = '<html><body><script>if (top !== self) { }</script></body></html>'

          nock(this.server.remoteStates.current().origin)
          .get('/index.html')
          .reply(200, html, {
            'Content-Type': 'text/html',
            'Accept-Encoding': 'identity',
          })

          return this.rp({
            url: 'http://www.google.com/index.html',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include(
              '<script>if (self !== self) { }</script>',
            )
          })
        })

        it('replaces obstructive code in JS files', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/app.js')
          .reply(200, 'if (top !== self) { }', {
            'Content-Type': 'text/javascript',
          })

          return this.rp({
            url: 'http://www.google.com/app.js',
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq(
              'if (self !== self) { }',
            )
          })
        })

        it('handles multi-byte characters correctly when injecting', function () {
          const bytes = `0${Array(16 * 1024 * 10).fill('λφ').join('')}`

          const response = `<html>${bytes}</html>`

          return zlib.gzipAsync(response)
          .then((resp) => {
            nock(this.server.remoteStates.current().origin)
            .get('/index.html')
            .reply(200, resp, {
              'Content-Type': 'text/html',
              'Content-Encoding': 'gzip',
            })

            return this.rp({
              url: 'http://www.google.com/index.html',
              gzip: true,
              headers: {
                'Cookie': '__cypress.initial=true',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.include(`${bytes}</html>`)
            })
          })
        })

        // https://github.com/cypress-io/cypress/issues/1396
        it('handles multi-byte characters correctly on JS files', function () {
          const response = `0${Array(16 * 1024 * 2).fill('λφ').join('')}`

          return zlib.gzipAsync(response)
          .then((resp) => {
            nock(this.server.remoteStates.current().origin)
            .get('/index.js')
            .reply(200, resp, {
              'Content-Type': 'text/javascript',
              'Content-Encoding': 'gzip',
            })

            return this.rp({
              url: 'http://www.google.com/index.js',
              gzip: true,
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.eq(response)
            })
          })
        })

        // https://github.com/cypress-io/cypress/issues/1756
        // https://github.com/nodejs/node/issues/5761
        it('handles gzip responses that are slightly truncated', function () {
          const response = 'I am a gzipped response'

          return zlib.gzipAsync(response)
          .then((resp) => {
            nock(this.server.remoteStates.current().origin)
            .get('/app.js')
            // remove the last 8 characters which
            // truncates the CRC checksum and size check
            // at the end of the stream
            .reply(200, resp.slice(0, -8), {
              'Content-Type': 'text/javascript',
              'Content-Encoding': 'gzip',
            })

            return this.rp({
              url: 'http://www.google.com/app.js',
              gzip: true,
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.eq(response)
            })
          })
        })

        it('handles gzip responses that are slightly truncated when injecting', function () {
          const response = '<html>I am a gzipped response</html>'

          return zlib.gzipAsync(response)
          .then((resp) => {
            nock(this.server.remoteStates.current().origin)
            .get('/index.html')
            // remove the last 8 characters which
            // truncates the CRC checksum and size check
            // at the end of the stream
            .reply(200, resp.slice(0, -8), {
              'Content-Type': 'text/html',
              'Content-Encoding': 'gzip',
            })

            return this.rp({
              url: 'http://www.google.com/index.html',
              gzip: true,
              headers: {
                'Cookie': '__cypress.initial=true',
              },
            })
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              expect(res.body).to.include('I am a gzipped response</html>')
            })
          })
        })

        it('ECONNRESETs bad gzip responses when not injecting', function (done) {
          nock(this.server.remoteStates.current().origin)
          .get('/app.js')
          .delayBody(100)
          .replyWithFile(200, Fixtures.path('server/gzip-bad.html.gz'), {
            'Content-Type': 'text/javascript',
            'Content-Encoding': 'gzip',
          })

          return this.r({
            url: 'http://www.google.com/app.js',
            gzip: true,
          })
          .on('error', (err) => {
            expect(err.code).to.eq('ECONNRESET')

            return done()
          })
        })

        it('ECONNRESETs bad gzip responses when injecting', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/index.html')
          .replyWithFile(200, Fixtures.path('server/gzip-bad.html.gz'), {
            'Content-Type': 'text/html',
            'Content-Encoding': 'gzip',
          })

          return this.rp({
            url: 'http://www.google.com/index.html',
            gzip: true,
            headers: {
              'Cookie': '__cypress.initial=true',
            },
          })
          .then(() => {
            throw new Error('should not reach')
          }).catch((err) => {
            expect(err.error.code).to.eq('ECONNRESET')
          })
        })

        it('does not die rewriting a huge JS file', function () {
          return getHugeJsFile()
          .then((hugeJsFile) => {
            nock(this.server.remoteStates.current().origin)
            .get('/app.js')
            .reply(200, hugeJsFile, {
              'Content-Type': 'text/javascript',
            })

            let reqTime = new Date()

            return this.rp('http://www.google.com/app.js')
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              reqTime = new Date() - reqTime

              // shouldn't be more than 750ms
              expect(reqTime).to.be.lt(750)
            })
          })
        })
      })

      describe('off with config', () => {
        beforeEach(function () {
          return this.setup('http://www.google.com', {
            config: {
              modifyObstructiveCode: false,
            },
          })
        })

        it('can turn off security rewriting for HTML', function () {
          const html = '<html><body><script>if (top !== self) { }</script></body></html>'

          nock(this.server.remoteStates.current().origin)
          .get('/index.html')
          .reply(200, html, {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://www.google.com/index.html',
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include(
              '<script>if (top !== self) { }</script>',
            )
          })
        })

        it('does not replaces obstructive code in JS files', function () {
          nock(this.server.remoteStates.current().origin)
          .get('/app.js')
          .reply(200, 'if (top !== self) { }', {
            'Content-Type': 'text/javascript',
          })

          return this.rp({
            url: 'http://www.google.com/app.js',
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq(
              'if (top !== self) { }',
            )
          })
        })
      })
    })

    context('FQDN rewriting', () => {
      beforeEach(function () {
        return this.setup('http://www.google.com')
      })

      it('does not rewrite html when initial', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, '<html><body><a href=\'http://www.google.com\'>google</a></body></html>', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://www.google.com/bar',
          headers: {
            'Cookie': '__cypress.initial=true',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          const {
            body,
          } = res

          expect(body).to.include('<a href=\'http://www.google.com\'>google</a>')
        })
      })

      it('does not rewrite html when not initial', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/bar')
        .reply(200, '<html><body><a href=\'http://www.google.com\'>google</a></body></html>', {
          'Content-Type': 'text/html',
        })

        return this.rp({
          url: 'http://www.google.com/bar',
          headers: {
            'Cookie': '__cypress.initial=false',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          const {
            body,
          } = res

          expect(body).to.include('<a href=\'http://www.google.com\'>google</a>')
        })
      })
    })

    context('file requests', () => {
      let injectDocumentDomain = false

      function setupProject ({ fileServerFolder }) {
        Fixtures.scaffold()

        return this.setup('/index.html', {
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            fileServerFolder,
            specPattern: 'my-tests/**/*',
            supportFile: false,
            injectDocumentDomain,
          },
        })
        .then(() => {
          return this.rp({
            url: `${this.proxy}/index.html`,
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('index.html content')
            expect(res.body).to.include('parent.Cypress')

            expect(res.headers['set-cookie']).to.match(/initial=;/)
            expect(res.headers['cache-control']).to.eq('no-cache, no-store, must-revalidate')
            expect(res.headers['etag']).to.exist

            expect(res.headers['last-modified']).to.exist
          })
        })
      }

      describe('without injectDocumentDomain enabled', () => {
        beforeEach(function () {
          this.setupProject = setupProject.bind(this)

          return this.setupProject({ fileServerFolder: 'dev' })
        })

        it('sets etag', function () {
          return this.rp({
            url: `${this.proxy}/assets/app.css`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.eq('html { color: black; }')

            expect(res.headers['etag']).to.be.a('string')
          })
        })

        it('sets last-modified', function () {
          return this.rp(`${this.proxy}/assets/app.css`)
          .then((res) => {
            expect(res.headers['last-modified']).to.be.a('string')
          })
        })

        it('streams from file system', function () {
          return this.rp({
            url: `${this.proxy}/assets/app.css`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq('html { color: black; }')
          })
        })

        it('sets content-type', function () {
          return this.rp(`${this.proxy}/assets/app.css`)
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.headers['content-type']).to.match(/text\/css/)
          })
        })

        it('disregards anything past the pathname', function () {
          return this.rp({
            url: `${this.proxy}/assets/app.css?foo=bar#hash`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.eq('html { color: black; }')
          })
        })

        it('can serve files with spaces in the path', function () {
          return this.rp({
            url: `${this.proxy}/a space/foo.txt`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers).to.have.property('x-cypress-file-path', encodeURI(`${Fixtures.projectPath('no-server')}/dev/a space/foo.txt`))
            expect(res.body).to.eq('foo')
          })
        })

        /**
         * NOTE: certain characters cannot be used inside our own monorepo due to our system tests also needing to run
         * inside Windows. The following are reserved characters:
         *
         * < (less than)
         * > (greater than)
         * : (colon)
         * " (double quote)
         * / (forward slash)
         * \ (backslash)
         * | (vertical bar or pipe)
         * ? (question mark)
         * * (asterisk)
         *
         * @see https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file#naming-conventions for more details
         */
        it('can serve files with special characters in the fileServerFolder path', async function () {
          await this.setupProject({ fileServerFolder: `dev/_ ;.,'!(){}[]@=-+$&\`~^ĵ符` })

          return this.rp({
            url: `${this.proxy}/foo.txt`,
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers).to.have.property('x-cypress-file-path', encodeURI(`${Fixtures.projectPath('no-server')}/dev/_ ;.,'!(){}[]@=-+$&\`~^ĵ符/foo.txt`))
            expect(res.body).to.eq('foo')
          })
        })

        it('sets x-cypress-file-path headers', function () {
          return this.rp(`${this.proxy}/assets/app.css`)
          .then((res) => {
            expect(res.headers).to.have.property('x-cypress-file-path', `${Fixtures.projectPath('no-server')}/dev/assets/app.css`)
          })
        })

        it('sets x-cypress-file-server-error headers on error', function () {
          return this.rp(`${this.proxy}/does-not-exist.html`)
          .then((res) => {
            expect(res.statusCode).to.eq(404)

            expect(res.headers).to.have.property('x-cypress-file-server-error', 'true')
          })
        })
      })

      describe('with config.injectDocumentDomain enabled', function () {
        beforeEach(function () {
          injectDocumentDomain = true
          this.setupProject = setupProject.bind(this)

          return this.setupProject({ fileServerFolder: 'dev' })
        })

        it('injects document.domain on other http requests', function () {
          return this.rp({
            url: `${this.proxy}/index.html`,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('document.domain = \'localhost\';')
          })
        })

        it('injects document.domain on other http requests to root', function () {
          return this.rp({
            url: `${this.proxy}/sub/`,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.include('document.domain = \'localhost\';')
          })
        })

        it('does not inject injects document.domain on 301 redirects to folders', function () {
          return this.rp({
            url: `${this.proxy}/sub`,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(301)

            expect(res.body).not.to.include('document.domain = \'localhost\';')
          })
        })

        it('does not inject document.domain on non http requests', function () {
          return this.rp({
            url: `${this.proxy}/assets/foo.json`,
            json: true,
            headers: {
              'Cookie': '__cypress.initial=false',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(res.body).to.deep.eq({ contents: '<html><head></head></html>' })
          })
        })

        it('does not inject anything when not text/html response content-type even when __cypress.initial=true', function () {
          return this.rp({
            url: `${this.proxy}/assets/foo.json`,
            headers: {
              'Cookie': '__cypress.initial=true',
              'Accept': 'application/json',
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.deep.eq(JSON.stringify({ contents: '<html><head></head></html>' }, null, 2))

            // it should not be telling us to turn this off either
            expect(res.headers['set-cookie']).not.to.match(/initial/)
          })
        })
      })
    })

    context('http requests', () => {
      beforeEach(function () {
        return this.setup('http://getbootstrap.com')
        .then(() => {
          nock(this.server.remoteStates.current().origin)
          .get('/components')
          .reply(200, 'content page', {
            'Content-Type': 'text/html',
          })

          return this.rp('http://getbootstrap.com/components')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })
      })

      it('proxies http requests', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/assets/css/application.css')
        .reply(200, 'html { color: #333 }', {
          'Content-Type': 'text/css',
        })

        return this.rp({
          url: 'http://getbootstrap.com/assets/css/application.css',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.eq('html { color: #333 }')
        })
      })
    })

    context('when session is already set', () => {
      beforeEach(function () {
        return this.setup('http://getbootstrap.com')
        .then(() => {
          // make an initial request to set the
          // session proxy!
          nock(this.server.remoteStates.current().origin)
          .get('/css')
          .reply(200, 'css content page', {
            'Content-Type': 'text/html',
          })

          return this.rp({
            url: 'http://getbootstrap.com/css',
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        })
      })

      it('proxies to the remote session', function () {
        nock(this.server.remoteStates.current().origin)
        .get('/assets/css/application.css')
        .reply(200, 'html { color: #333 }', {
          'Content-Type': 'text/css',
        })

        return this.rp({
          url: 'http://getbootstrap.com/assets/css/application.css',
          headers: {
            'Accept-Encoding': 'identity',
          },
        })
        .then((res) => {
          expect(res.statusCode).to.eq(200)

          expect(res.body).to.eq('html { color: #333 }')
        })
      })
    })

    context('localhost', () => {
      beforeEach(function () {
        return this.setup('http://localhost:6565')
      })

      it('makes requests to ipv6 when ipv4 fails', function (done) {
        // make sure that this test times out relatively fast
        // to ensure that requests are fast, the retrying functionality
        // does not extend them, and that the server closes quickly
        // due to the reduced keep alive timeout
        this.timeout(1500)

        return dns.lookup('localhost', { all: true }, (err, addresses) => {
          if (err) {
            return done(err)
          }

          // if we dont have multiple addresses aka ipv6 then
          // just skip this test
          if (!_.find(addresses, { family: 6 })) {
            return done()
          }

          // create a server that is only bound to ipv6
          // and ensure that it is found by localhost dns lookup
          const server = http.createServer((req, res) => {
            res.writeHead(200)

            return res.end()
          })

          // reduce this down from 5000ms to 100ms
          // so that our server closes much faster
          server.keepAliveTimeout = 100

          // start the server listening on ipv6 only
          // for demo how to bind to localhost via ipv6 see project
          // https://github.com/bahmutov/docker-ip6
          return server.listen(6565, '::', () => {
            return this.rp('http://localhost:6565/#/foo')
            .then((res) => {
              expect(res.statusCode).to.eq(200)

              return server.close(() => {
                return done()
              })
            })
          })
        })
      })

      it('handles 204 no content status codes', function () {
        nock('http://localhost:6565')
        .get('/user/rooms')
        .reply(204, '')

        return this.rp('http://localhost:6565/user/rooms')
        .then((res) => {
          expect(res.statusCode).to.eq(204)

          expect(res.body).to.eq('')
        })
      })
    })

    context('blocked hosts', () => {
      beforeEach(function () {
        return this.setup({
          config: {
            blockHosts: [
              '*.google.com',
              'shop.apple.com',
              'cypress.io',
              'localhost:6666',
              '*adwords.com',
            ],
          },
        })
      })

      it('returns 503 and custom headers for all hosts', function () {
        const expectedHeader = (res, val) => {
          expect(res.headers['x-cypress-matched-blocked-host']).to.eq(val)
        }

        return Promise.all([
          this.rp('https://mail.google.com/f'),
          this.rp('http://shop.apple.com/o'),
          this.rp('https://cypress.io'),
          this.rp('https://localhost:6666/o'),
          this.rp('https://some.adwords.com'),
        ])
        .spread((...responses) => {
          _.every(responses, (res) => {
            expect(res.statusCode).to.eq(503)

            expect(res.body).to.be.empty
          })

          expectedHeader(responses[0], '*.google.com')
          expectedHeader(responses[1], 'shop.apple.com')
          expectedHeader(responses[2], 'cypress.io')
          expectedHeader(responses[3], 'localhost:6666')

          return expectedHeader(responses[4], '*adwords.com')
        })
      })
    })

    context('client aborts', () => {
      beforeEach(function () {
        return this.setup('http://localhost:6565')
      })

      it('aborts the proxied request', function (done) {
        getHugeJsFile()
        .then((str) => {
          const server = http.createServer((req, res) => {
            // when the incoming message to our
            // 3rd party server is aborted then
            // we know we've juggled up the event
            // properly
            req.on('aborted', () => {
              return server.close(() => {
                return done()
              })
            })

            res.writeHead(200, {
              'Content-Type': 'text/javascript',
            })

            // write some bytes, causing
            // the response event to fire
            // on our request
            return res.write(str.slice(0, 10000))
          })

          return server.listen(6565, () => {
            const abort = () => {
              return r.abort()
            }

            r = this.r({
              url: 'http://localhost:6565/app.js',
            })
            // abort when we get the
            // response headers
            .on('response', abort)
          })
        })
      })
    })

    context('event source / server sent events / SSE', () => {
      let onRequest = null

      beforeEach(function () {
        onRequest = function () {}

        return this.setup('http://localhost:5959', {
          config: {
            responseTimeout: 50,
          },
        })
        .then(() => {
          this.srv = http.createServer((req, res) => {
            onRequest(req, res)

            this.sseStream = new SseStream(req)

            return this.sseStream.pipe(res)
          })

          Promise.promisifyAll(this.srv)

          return this.srv.listenAsync()
          .then(() => {
            this.port = this.srv.address().port
          })
        })
      })

      afterEach(function () {
        return this.srv.closeAsync()
      })

      it('receives event source messages through the proxy', function (done) {
        onRequest = function (req, res) {
          // when the request is finally
          // aborted then we know we've closed
          // the connection correctly
          const closed = new Promise((resolve) => {
            return res.on('close', () => {
              return resolve()
            })
          })

          const aborted = new Promise((resolve) => {
            return req.on('aborted', () => {
              return resolve()
            })
          })

          return Promise.join(aborted, closed)
          .then(() => {
            return done()
          })
        }

        const es = new EventSource(`http://localhost:${this.port}/sse`, {
          proxy: this.proxy,
        })

        es.onopen = () => {
          return Promise
          .delay(100)
          .then(() => {
            return this.sseStream.write({
              data: 'hey',
            })
          })
        }

        es.onmessage = (m) => {
          expect(m.data).to.eq('hey')

          return es.close()
        }
      })
    })

    context('when body should be empty', function () {
      this.timeout(10000) // TODO(tim): figure out why this is flaky now?

      beforeEach(function (done) {
        Fixtures.scaffoldProject('e2e')
        .then(() => {
          this.httpSrv = http.createServer((req, res) => {
            const { query } = url.parse(req.url, true)

            if (_.has(query, 'chunked')) {
              res.setHeader('tranfer-encoding', 'chunked')
            } else {
              res.setHeader('content-length', '0')
            }

            res.writeHead(Number(query.status), {
              'x-foo': 'bar',
            })

            return res.end()
          })

          return this.httpSrv.listen(() => {
            this.port = this.httpSrv.address().port

            return this.setup(`http://localhost:${this.port}`)
            .then(_.ary(done, 0))
          })
        })
      })

      afterEach(function () {
        return this.httpSrv.close()
      })

      return [204, 304].forEach((status) => {
        it(`passes through a ${status} response immediately`, function () {
          return this.rp({
            url: `http://localhost:${this.port}/?status=${status}`,
            timeout: 1000,
          })
          .then((res) => {
            expect(res.headers['x-foo']).to.eq('bar')

            expect(res.statusCode).to.eq(status)
          })
        })

        it(`passes through a ${status} response with chunked encoding immediately`, function () {
          return this.rp({
            url: `http://localhost:${this.port}/?status=${status}&chunked`,
            timeout: 1000,
          })
          .then((res) => {
            expect(res.headers['x-foo']).to.eq('bar')

            expect(res.statusCode).to.eq(status)
          })
        })
      })
    })
  })

  context('POST *', () => {
    beforeEach(function () {
      return this.setup('http://localhost:8000')
    })

    it('processes POST + redirect on remote proxy', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/login', {
        username: 'brian@cypress.io',
        password: 'foobar',
      })
      .reply(302, undefined, {
        'Location': '/dashboard',
      })

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/login',
        form: {
          username: 'brian@cypress.io',
          password: 'foobar',
        },
        headers: {
          'Cookie': '__cypress.initial=false',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(302)

        expect(res.headers['location']).to.match(/dashboard/)
      })
    })

    // this happens on a real form submit because beforeunload fires
    // and initial=true gets set
    it('processes POST + redirect on remote initial', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/login', {
        username: 'brian@cypress.io',
        password: 'foobar',
      })
      .reply(302, undefined, {
        'Location': '/dashboard',
      })

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/login',
        form: {
          username: 'brian@cypress.io',
          password: 'foobar',
        },
        headers: {
          'Cookie': '__cypress.initial=true',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(302)
        expect(res.headers['location']).to.match(/dashboard/)

        expect(res.headers['set-cookie']).to.match(/initial=true/)
      })
    })

    it('does not alter request headers', function () {
      nock(this.server.remoteStates.current().origin)
      .matchHeader('x-csrf-token', 'abc-123')
      .post('/login', {
        username: 'brian@cypress.io',
        password: 'foobar',
      })
      .reply(200, 'OK')

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/login',
        form: {
          username: 'brian@cypress.io',
          password: 'foobar',
        },
        headers: {
          'X-CSRF-Token': 'abc-123',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(200)

        expect(res.body).to.eq('OK')
      })
    })

    it('does not fail on a big cookie', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/login')
      .reply(200)

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/login',
        json: true,
        body: {
          'query': { 'bool': { 'must': [{ 'filtered': { 'filter': { 'term': { 'brand_id': 3 } } } }, { 'filtered': { 'filter': { 'term': { 'is_live': true } } } }, { 'filtered': { 'filter': { 'bool': { 'should': [{ 'term': { 'subcategory_id': 25 } }, { 'term': { 'subcategory_id': 21 } }] } } } }] } }, 'aggs': { 'colors.raw3': { 'filter': {}, 'aggs': { 'colors.raw': { 'terms': { 'field': 'colors.raw', 'size': 50 } }, 'colors.raw_count': { 'cardinality': { 'field': 'colors.raw' } } } }, 'patterns.raw4': { 'filter': {}, 'aggs': { 'patterns.raw': { 'terms': { 'field': 'patterns.raw', 'size': 50 } }, 'patterns.raw_count': { 'cardinality': { 'field': 'patterns.raw' } } } }, 'custom_filters_a.raw5': { 'filter': {}, 'aggs': { 'custom_filters_a.raw': { 'terms': { 'field': 'custom_filters_a.raw', 'size': 50 } }, 'custom_filters_a.raw_count': { 'cardinality': { 'field': 'custom_filters_a.raw' } } } }, 'custom_filters_b.raw6': { 'filter': {}, 'aggs': { 'custom_filters_b.raw': { 'terms': { 'field': 'custom_filters_b.raw', 'size': 50 } }, 'custom_filters_b.raw_count': { 'cardinality': { 'field': 'custom_filters_b.raw' } } } } }, 'size': 100,
        },
        headers: {
          'Cookie': '_treebook_session=MmxpQUFjak1mZXN1L21FSnY2dzhJaWFPa0kxaXR2MFVMMTFKQnhFMTY0ZGhVZDJLV3BPUm9xT3BWREVDOFExTFBSaDEzY2htQTVVZ0dpZjg0VmF1SmRINlVSZ2ZFeFpzd0s3Yk4wakRxQS9TdW11N3ZURnIvbHAvQ2NTVjZWY0VqdFNQZTFHV09xclZnM0lDNE1JUzZzN3BWamF0dXRSM09uRFZZeWMwd01ESkdWUzY2MFE2QkY0cStIQnBwNGk0V3hhWkNVd0QwamtMeDJheWxxb04wZVkwRzJmdmVLZXJsR3M5UFAyK0Y3ST0tLTBFWmJwWktQaThrWnN6dUZVaVBGckE9PQ%3D%3D--a07f8cd3fc4db9a0c52676e274e71546a9f047fb; _my-site_session=NVp4akFGelljaFZJR3A4US9ES1ZBcTZ4K2ZqNklkUzNKZUVGU3RuQk1HSGZxenU1Z2VDOHBvTmdwL0x3c0E0TGEvTmZDWVR5Y205ZkVOZWwrYkdaWEV2V3k0T1h0elN1NjlsSWo1dFZqVG9nNy9MNWp6enoyZmdYSzYwb3d4WVlvMG9qVXlOTnNNSm1VYlpSSWc3bkFnPT0tLWhQcnVqQ0NQMGF6dVE0SCtRQk1sdmc9PQ%3D%3D--2d25be12c8415195314fe3990cad281c14022d9d; _first_app_session=ajBJcFpRa2dSR29MaTd5UUFnTU45dVZzd2tKeUY2enpuR1cyNFB2bVRCQ201RTh5bXAvaTdlN2NuRm1WeEJOZlkyTWtIRXhpZm1HTlZMM0hPeHVzWUkvQWNhUmNUcUNRRzlDbW8yMlA4SjFZSjhYQ1I4V0FNU3k2Um1mOHlQNU94SkdrT1ZmZS9PZHB6WDVGN0s4cGNnPT0tLTA0aE5hQStvbXQ5T1VXN0UrT3MxN0E9PQ%3D%3D--1daec80639465389f0e5437193e633eeb7bbfca9; _pet_store_session=N055S0M0azJlUlFJWGdDN01MQ3Z4aXFCWHNFU2ttZUp0SDJyL3BPeTVOdzBYWGROb1F1UWx2eG80ZjlobDF2QWJ4Rk5uVFliSWtMSEltZ2RUVDNZUVFLd2VYS3JTQldRbkNnMVdReVY0V1FyWjBNdTVjSk9SQUJNZ0JmMitEcG9JQnh0WVErY2lZaWo4WGJFeXpKUElBPT0tLUZDL2k3bUlKQUl4aGV3ZGEvQXRCaUE9PQ%3D%3D--a658fa7995dec5c7ec3e041d5dc5f52e4f7be0ee; _adventures_session=MDZDeDBDQmRJRFdpYzk5SWFEa0txd0xBVmQyei9xTUhQZ3VlZjNRcUY2c0VsWkZaNUo2SktlNGRvcFNrdDlqL0wzRnA4eVdpMTdMUjJlcHJuMkVWU05SdmNRa29QQU5HWlhxajRZcWNSY1lqR1RDZjhsQ3loUzMvd1M5V3ZCck5iMHRkQXgzcFAwRlBOMFFja2dURDFBPT0tLWMyMHZvcnV6OUIvS0tkeFFpTVA5Qnc9PQ%3D%3D--04a940aa32a208e9bfb6b422481e658f57411132; _classroom_session=NFRSY05TaHZZdkVMYkRZdXh5djQxSmxYY2xIaHJDamI3bGJuRjRxbDZCcWxCMVRxOVpkdWV2MnQ0ajBBNDdOb0ZtTUZPUkFLNmJ0SHFVUlJCZ3FUSjBvSUkxTzZpL1h6ZWhsVlJ6Z2xGRjhWamlVSHJ3NG1vZ3IxSC9PaUxkNVA0Q2x6ZDRTaXJxcGlvc0tsazdkRHFBPT0tLTZ1Z0hxcU16cmZoRTR1VHBqN3RkbXc9PQ%3D%3D--cea92642cc4ec52a81ad6892db90e0e8b8236069; _boo_scaffold_session=am5oQVhMN2ZQQlJBb2VUdDNtdUVic0NMeFlhWVJOa0Y5SEhERjdpUmd2aVZicnY0Z1VsL0hTWVNudTF0dm1SQWNKZHhzZmpJQi9FK1JZVXZwU3Q2RHNObmFWcVg5T0thYmUrY0k2YTJaQjMzUVp3MlRNenk3a2JxczdWZmF6MUxEaW1EejlxeWpUNjFack4rM3N1bm5yZlFKT3BTYnIvTTNNaG5haXZrMEFZWUp2cHBRQnNXbldLUkRZZlBuRDlWdWRldTJqYmh6K0lWWGRyVGpOUERtbFBQUFVHS1pOR3RtMmRuYUxLbjUvYXQra3UwcUxkK3BHRzFRR2RqMWVGay0tQU9DdlFMNEluVVJPTUNlbDh3L1Y0Zz09--c3e2745720ea2080dadaac45223d36ed15fd7fb4; _db_explore_session=RW5NUDlSaG5SVFF4Zms4YmRwQmhZaitrckhRVXN0VzlKS3E3M3Fxa0xwQmZGcDY1amlVOG5DRnpPQ3hLSVBoUFZ5b3lKWGd2Z0JZWnptMEREcU1DUE04SkRMN1RUbVUvUDFaTkNFcUpqQkZ0NmxjTkhrZHZlM1pibmIyTGQxZ3UzNVpvTUlDSnNhcUxBcHRJaVJqdENRPT0tLTBXWVhqK3lwcTVONzVLRVhnZldmQkE9PQ%3D%3D--10c607bc41831a8b4e80689d051a5cfc19872cc1; _furniture_store_session=cm5lTW9XR0ptc2lCSVJNY0c3dW1oVFlJdG9OaGh1OENhdjgyMW5Heis0RlB3ZkNPR2ZZUmdiV1VlbGY3NmdmdHU0cERBZGtpWGFUeHo5cHM4K1lKa053cEhrV2VaR3Q5RVYzZms0VVh2aFBrd2N6U3hzeWhZTEhnVG1qYldxNFZOemVTMGRkQmZQSEFHWEJZZWNQWS9BPT0tLWk1R0d0SW1pZVEyckRGK2R1Vzh4M0E9PQ%3D%3D--99c9ed2f5a43af5bc018d930b6210b50bf973a79; _travel_session=VEcxVlB4NTg0SGNHdjdOekZndW5Jc1FJY2VJd3NTaDhVVk4vNnVuekpWUVE2ekVhK25YVWVUemhOUnl2S3pVWTc3U0trTTI2cUVNakwyd254M3RMT0J2L0dheTdRUVpGY1FRd0FTT3pSaGpsK3kreVJxNVdMbWFsY3pWSVdMUU5mRzRzQnIzRzFNMS8zQThZQStLTE9nPT0tLVNMK2hsYjVpRmZNMngwUFI1QU0zemc9PQ%3D%3D--19113054b718f1b9c733427c9a3e110b60187f4f; _doctors_office_session=RGxTSWhxVm45am0rSGZVb25jRnBVdVRvcHIxbTR3dVZWdjYvYklGY3BVa2FnYm5sRXlNUlp2TmN2Q3R3NndxWnFFdStPT2ZieTVKaE1SMUpFM0ZUaFhUb3ZhbkxDbDlrZk9lUVh5dlRCY0hhQ1NVNUVKSjhJSnhyTkFkWi9FUm1UZis1VEhVb2tXQW9Qb2MrQU5IMHNRPT0tLUMxdlpYMEVKV081L3QveFBHMS9scWc9PQ%3D%3D--7a4196ea6b5194f412be549a0f30925ec6bd118f; _recipe_app_session=OE1saTRQZ1pRQnNrdHNCNllyNld3cnVTcnhqUjh0Q2NZaSt3eWlLbjljUWxMdk5seW9SVnQwcmZ4VVBhdWRDUE5qM1hWSi9QaW9adnVFalJ6VjJFVFFhWm1LZFB1ZXlzRzR1UFpDSks0V01pdWFuWk04bExMeDdvYWFZRU9OQm5qQ2ZKcXRLYUdiZmwvWTYwUCs4bnJBPT0tLVdtYkh4cmFJeHQrZXdoazFGSUo2aGc9PQ%3D%3D--1649c7bd76e8944a0911d9e6a59d5a82aa1a0559; _ajax-sample_session=ZDM2NU8xZTRocmxFUlR5ZjZhMGxUSkgzdmFOcVVrQ1ZUN1ZNMFliRGNuRFQ2SkNvV1pVdUlLRWVoY2dodWxQRjNiek84Y0dhdk44dkN6Sy9naDRsQjFRY2FVMXYzcXc3TkVzY28wMnp4OFdiWnBFMFEvNUltK1ZYUUd2THRMblpLVmJHOFIvMEVQaWpMV2dqamI1ZFBnPT0tLTJ4RURLbjVEYkZaSGpvdDk1RU9sNEE9PQ%3D%3D--f13942ae013f1252c609762922b21b8a233b36ed; _stripe_test_session=RnRoMngvN0IwVjBENElrY0w1eStwOGYxdDgxKzNBbStYaHErMkxRQk9xUGFMenRqU3h3UFVNSGNoKzNWSXZJMVZHMXYxcUoyeEpBMVRQVk9CQktOampnaFdYdUJzYTFjSTJJYlI5SkpzTVdPSVJTNU5GaGR2UVJqa3NNaW1UM1l2N2YxUWVKeEtzOUtneldlVjdNcm1BPT0tLWEyaVVValdCSlJhcmRJUmNXVGNqR3c9PQ%3D%3D--66f51d7d80652f09a3d2c56f94a8bd6380d4972b; _wunderground_session=SFViSXNZeVFMYkp0MXNOWkZiSW5BMG94QzlqOFBIZnBSOGY2S3B4RkIybzFZdFBQeUlZTlAwMjVNRWJqckRRc2R6V1pweWZhdmpqcTgrNWliM3Izbk4xaWo4d05Tc1YvMyt4L2tuNTlIVjlUZUpTZEwxcE0xUXRTTjAwQjI3eVpSM2c4MlRnY21jUEpIcGo4SjNnY0pRPT0tLTc3TlMrZjFJT1U2S1cySm9DN0RDNGc9PQ%3D%3D--accf1fa6ea2a345286abe82acd0e882d9f4f2c40; _ecommerce_app_session=S1JlZ3BYTDZraDdZU3RZUmpCMHR2aTRGaUpvL1BJN0p6MjRqM0krbXplRFdjemhOMnQ0ckp1ZERzTUp2eWQ5Zit2bEVCOGZLRU9pOHJCRHp1Z0Z1UUZtRlVEVnBhaFBielBjckNMVmlXR0dxS1ZabjNKUFdBcVBUR1JSUlUxYWFSemNNem50TzFxam9aU1BTRXpvQkNrWHpMMVdvUEM2MjdWbHh3NVdYU2QxM1ZwMmFWM3RZdjVlSWFnd1o5OWxtb1lMenJiVStKUnRRcHEzdHlSTGUvdDlCcnFXWDF5TTBmdXFPN0VsUHJxVk50dTREeHkzZG9PdERZV2l6WXJIOEpyVnRjU0FVOW9XeWpldzdZVFBXM0xFTktjQWFMbXpuWHlLay9pK0ZhSVZ6dUVsVXJleDYwR090QjdmaTIyb0E5ODh6cWVHaTE2SHFCZ2JrcWFaMmtWTlM0K0lVejNUZVZkQThGVTN4N3VBPS0ta1E2clFzb1VRQS91WEFOYjl2NGdJUT09--c47816c90bd08c466f3f8f60f4db07eb40807b08; _Top5_session=dndqMXRCdFVxbERXWCs4UStiQ1gwc0daWE9aOW1wRndWTHVjSk1kNXR1T2xoOUNwbk1ndGR0T1lqZXBkSUVuN2VPRU05RnNxcGx1aUg2RjJya1dWaUNTekZ4RzZCb0VvdEFNYmhaUHNjZXhmWDFWM3EzK0lVUm4yazhoaXZLZlpxSldqUC9GN1NMNm54NHpyRUpTK0tBPT0tLW5QQldSb2VVVWJ2V2syRDhXVUs1TlE9PQ%3D%3D--3f5773b8063cfd8dc61e917501485c86e625a4a6; _recruiting_session=cnlTQ2h6YWZKZFVPb1Q1cklSVngvK3hTK0M5ckhJUmhheE83QStTRThCeGg0dGpaNGJCMVRrUGFiQXphQm5Pb2FZbGNkV095bGdNNjlMUmRCTmhSa2duNzRzZEppc2JBT0VoSnZIVWlCMVJtWXZmZktJQWgvM3paM2ZKbmZCdWd4MGw0SHF3OGt6b0xJaXhXTzVGSGxaL2ZBNkNPZ0dGL0ZPMklkNXVKQXRTdFY4Y0J4bGx1eTZYWW9QQlpPZ2JsLS02b3NpWmZibGJGd3JhWEg0TUJzYUpBPT0%3D--722ac1ecda4ef81214e52effeef8fe14317c2bd3; _marta_near_me_session=N2MreUZINElveVZMN2NyNkUrUkduZVZBZHdHMVRCcHE1TE02ZXlKeGdJd21iYUlDeGl4aGkwWUNiODZPRVNPTTlGd1ZlRWlJZjZTUHVzZ25qWHdtaTg1NjBkR3hKQ2hjSWUvTElQY0t1azN3UmpJbXQ2T0xiTlpCOVphTkVxcjlrNVVGNXhNcTZaY3dVY0JEcmtUb0FkeWRVQVdtWm5sU3l4NG1tbWQ0Z2lSYXpNSUsvNGt1V0IwV2NQV1RjVEZ5NWpWUG0rQWR4N1FTSzlxcUFLRW1LOFVEY1VzaXd2K0x4OHJnRVV6OVdlNTI0ZFJGUytqbUNmMmI0SWJsVWpnRWhWTTNWRnUzYksvazNTK01Zd3drTWc9PS0tVWxaSG1FeGl5Z2JrcUxXUUl3aDhJUT09--80376da7d66242e7d73d7e1e598b115d22ec59d6; _sassy_session=MTBuOGpOaVlWbDc3NEl5U0t5U0o3OHk3N0VOc3FNbVdnU2xEajBqTGtaQm5sMStQT3E0bTlLZmpRYy9zY2xKOVgrK1hhcVhSc2UvalVWYm9jS2RlMlhMTCtOK1JETFZQRUtnTUxRSmlrOHFNU0l4SmxmSTRYcUIrSHJ4cEJBbUNZMXBCS3NBL3hoYmhJY2xOZlJyaW13PT0tLW5ZOTBjUS92MjJ3bXlNWlRwb2wvZFE9PQ%3D%3D--62667911aa0f694c2215d10622c4a2e6d4d41007; _gf-hackathon_session=Z0xBUTAreU1EM1h4NFluL3BsMUhicE9wa1BtUHdQRWRic2NpOWh3NjIyNnduamRsZGh4UDhFcW83MDhXenhhQ2ZsNloxKzZsa3RxQXcycVVtcUw4Tnh4UVRwTVVqUWJiOExtSnQwcHJFb1BnM3d4eTVjejgza3pPTFV2OEwwWTZ2UE04cmVwc3IvN21wRks3c0NWK1A1dEpYdmVsK1NlTGt4b2JKRkpSOE1Db2oxajE0aHQ4YS8wYXVLNDM0OTBkcXlQUzJUVFlUeFc5dUxuRzNtaVU4YWZUSVBKQVUwM1dkRmFJcUpiR0JlST0tLVJEMzZNUWpmU0hqcFEzbVAyLzlDVFE9PQ%3D%3D--7bd822b0ba783a644ba067a9bc664450c8d8c7bb; _Library_session=eXhPTWVQLzFWcVlzcCtIMVJReDdaSzBLZXFsa3NJeFpzb21RdUYyb1d1OHJGaWdhMmVxV1l2aDFkUHZ3dUhLalRFenN6QWpPVDFnSTFKQUJpaWE2MHJZOXVtaWVGSU95SnVQeE13ZmdoV0FMYlYvSDR1NVRQMld5NTgxYTRnbS9VekZlT1VuNkl0TVVwSDdWMDNsbFZ3PT0tLVpocjJmTjZBSDRueTEwc3VMWHZ5Rmc9PQ%3D%3D--7470bc2a23b85bab792f4a9d2ef7e75438503948; _fittery-project_session=NVdHZ2Y4c3h0VFJDQkQ1d1lmTFlNVnZyeml1RzVoN1NBMnh4OTFCYmdYQXQyS0oyT1M5R2R2WFRSNStmdEhWMVpmcWJJYTR2a1RwNnJ3b0RnTWpKZTE3amtPQVhYeERUVWdVbC9pbjF0U2g4T1FFQzJDb2pjZGFDZnhFUkJqOUtuN05jSG1WSVRaZm4wQUgxNjZNWllnPT0tLXhONHdmQkp6T2RvbEVyL09POU8xK2c9PQ%3D%3D--559898f1567aac047c39765abe134e9c9b5081c7; _rubix-3_0-rails_session=ckZBdUFhOCsvbjBxWGk4SGZyQkJkZGFvdG9ReG9wRVBkTVBrRzljN1d5WXMxbzBJakNXZ01KamdGZTdpbTNiTUZPNktObGppbzZndEdkaE84S1pRU3RubEpsMm1VTndiNlVmYk9oWmN6dHczc3RWWUMwUmg2a1JWN1gzK2lmR3Y0aHFBUEJjTU9qOFo3MlZmSkh1dkVRPT0tLVZuN3FJQnhuZER6UVlmaXUvWm5yaGc9PQ%3D%3D--beae7a3f4cd8c9179965f81f4da275b27c9fd20c; _mainmarket_session=OGNILytyTzFxR1RRd1I3dnJva2V1UWMrYzBBckRkRC9nWmxxWC9MdXhUcUMzV0QxbVFnUVAzdWpXU2l1VFByODNDdWRpUzYyVHVwVTFlamNIaGFiSk9kTkZWSy9kWHpqa0xneC9FeVNOZjNYbDhMVU1UT0dYOElua0NaMTV3dFRoV1RHaGRIS3dMcElTZ0p6K1QxYnVrWlNTRXJMenlkVUZ5aWtnWkpRSFZndEpFMHVNR3gxcFRGYVhKaGVUT3BvVEdKMGRRUmFERlQxUDYxbHRJc29OamZJWVM5UUJSeXZzMDVzaUxzN3JYcWswYXZHb0YxZTFuNlhxYlBleEs4ZFBvekkrOXFOYU9QeUcrUHowZ3FpUG0zaE5NamwvOUppZSs1VWV3NXczbi85M2pGWG5ENnlvd1lCcGc5bEpUTTZBeUkyM2Vyd09Vb0dqSjd6Q2x5Z1g4MllzZzV3TkU2ejZ4ek5lVmtGaHlIcGU5NWlXMlNLazc2N0JvUHorT2o0MURRQVFUbHZLMFBraHAxTWRYZGZmT2gzMUx0aDdkdDNESFdMV1hLTUJZQS9XS3RsSGc5U3FQSzJaUmRjdDBjMi0tQlgyVzJITjVPbURqN2gxK1d5dmdQZz09--121f584b91d060b407193488b5341fc4919bfa28; _blog_app_session=VU0xeHFmL29hRTdBTWl6WExCZ2JGbHFwL2s1Qnh0QXpBajlsU2ZseHpDdjl3TzhHZzl0NHhVSFVLUktqRTRxejlYTXVFMW9rRllZSTJ3NTlUcHZHYkdhaFFObG43bkN5VkgwbmdzRWY0c21ZT3RJM0lFcXpCMHh1YjRqakpMdFFPZzc4b1dXLzRsQWc5QXJPMTdZNmwzajBOeG5kRHduYzdObFZSUDNMakFHUXNmU3k3MFdCYkRncU94cE0zcEVyOEN6dER2aXYwUGo2Mm44NW1Ub29sSzJ2RUxGVmV4V05oM2JUUHVjV1hhRT0tLUM4YUM3MUpPeWtDSEYxMTU1aStyR3c9PQ%3D%3D--f30b07b16552349bfb6d11fbae3afd1cbac32bcf; _todo_list_session=eER5TjRjMWdEL0p4eVY1SHFlcUdCYzhVNldhRk5qclVEWTJCSVFjdkNZcXFvT053VXRpU1NKdG9qb3dFdGdpMUwwcmxXbmJIMXVrbDBxSFVjZTNXcHBIbDRkTXhGaTRmTm90YXZ4d2plSWtuWWlwZGdMSkVMRkliSS8wajhVejJ1MC83Q0h3d2NuaTdmMC9WT3o4NTVnPT0tLWtmUlh5SzFiQ2llZHk0am15d3dzeVE9PQ%3D%3D--5a16fdce0a2c0afe942f70c3203334df3a64d2e8; _tts-reddit_session=WkxWcERrRUJFNURkTGxvR3h5VHpPa2FhWXJhc0RrUElIOFVuT1ZhQ3FGSXhta0ZnVm1GNlVUdnJmOUxIOE9aTUhUcS9hMGY0bFl2K1dyUEYvTlpaNlNjTjV4OHBvWW1YdzM0SFozUkZKQTd5YktMeHI3dXRDV21hN3piaGhyalh6b1EzSExmb0Vod1FRYkhPeU1meFVGaUhPVVM5cllPV3dRT2dsQlM4Ty9vT3VRSkdmcTBsZlFhNXBrYU1CWWlMUE5FSmZDam5DRjlUOGdOMjlHOW9TdVVSYlR4MVlFdWZ2b0dzYTJFajhsMD0tLWY5a1o3U1krKzRUK3pBNmc0bEsyS2c9PQ%3D%3D--458a23790e533b457ebbb80e9dd5bdf76e0de77a; _tweeter_session=ZFpCZHR2dklyd0ozUzJ4ZDBCWjhGZVJ1bFlvNGo0bmdIdkltalN4aDNmY1RsbmlhczR4cThsa3JJUGlFZ0JxcHFiUSsxOU5LbDhVdmtsb2ttWndpUWVMcXYzNEpEbXRpZ3JyOERrQytxMmoxT0FZd1orNDdQOEFGNFFqWllyWmJIdHE1RFF5aVY5MndoOGVmOUpMZTZFbEdJTjk2QzhUQWZXOEJNOCtXbWphM2QwS2NxRkhOUFl6ZTIrMDd6RHFJd2QyTDJkVEh5SmhqSnZvVjZZUllFbU5vOExXQmFGM2ppV2JXSXBXRUo3ZVY5ZG5ycEo0dnRnb0kxeitUT1JNWmhTZnNIMDVvbjV4emxQUDF5b2x2Njk3djREZmNza0NudDB4ZW0yay8xaytYS2QrU0cySzJ0ZzEvUUdhcEZwanBoN3o0OWpsaHVmYTc0dUY3U0R6VDN3PT0tLUE0Zy9mS0VmcGp2bXNDSVJ4UGQ2ZkE9PQ%3D%3D--e1ca4a8f11b7d639e0235fec0644adf6e4576888; _angular_rails_reddit_session=RVQ2anNFSE1qK3VGYjFyMzdTTnRXc1ZDM25JNkNqT25OT1ZTK3RWUXptUWtwSHZwVE1vOE5tUWJML2NKUDZVemRYcThicUpYYzJxejJab3RPanRNR21BSTZVM2NBVFRZeE94OE9QVzVhUTFFdUJ6WmljbTN4eFVQV1VKMkVyY3RjYlE5dkRyZVArelFNSTV5UWdqVTJBPT0tLTN4dUlHaVZXcW1wZFNER1JyOFBxWlE9PQ%3D%3D--67046be80e6a383c4ecf3d47bfb8b5d58f5ed7d1; _fittery_session=b1FVdGtyVTN5Sy9MOWdHTEJzU0RxYjBEeERteC9tTTd3ekFOZE02eXV3VHNTM29XV0F4dVhUb1ppTzNmdHZKZGRUSWVpU0lYTm1vQ045TFFCWDhKZldQTFJ1cWpvTkFiZlBIQnVuL0I4SGhIODA0bFNwK1diOVJXVnZ0MzNaekovcEN3dDI2cHdjN3lUSnVlVzdoYjY5a04wYXJiQk41aTc5TGVleExwZkZzdExGTDJrejJtTktiL0p4K3FreENBYnlPTW1WWXFSbEZMWWtidFdzMldDSDVyaG1acEM0OVhxREVlMUg0S0xWcGV2Q0dxTzNaODZWWmhvWWFrNW55SEJ3ZmtEMjR1YlpYSk5uV1Flem4wUjV4U0hSSUtyQlF0QUcvQkc5TGtBWUl1UFRNNEhzLzgrVlg0RmxMcGw3QW42UDVmUjVqQ1hPd0V1K1M1aXFFb0NnPT0tLUw1K0dHZXh6b3pPMDBNT1YwZFEyVFE9PQ%3D%3D--527a62a03427f1ed30709c0a8a591cadb7a26cea; _ladies-of-tts_session=OHEwdWNLVFJyRU8yQTEyVjZyNUp6YzdyUjNJSlVreU15dktVRk1QNlEzQ0xRcUFTUUx3M0hlTEZlUnE5MkNadmZwaWtqTUp0SVRQaGFZcHZ1TDh3am5wZ3J3MnBMaHVFOG5oeDZXTDBRb2VHcmVKZS9ORUpHSmFmcHg0V0dWKzdESGRkZnpZUGVoM3lvQU02VVBaalBnPT0tLVRPbTNQSkY3VUczUUk5UnQ1OUtZNkE9PQ%3D%3D--f48ce24828b13200003ee27dcc8717925dcfc9ce; _three-good-things_session=RWZ0NS92QVN2dWoxWkpzVk1RNEN6UmlXMlFhSnYyc0pXd1l1Q2NzMGFQM1BmMkJlM1gzMG9LeTFKY3I0L2NoUzJwRk1PZnprQUx6U3duUStYYkFBT055WkVRVVIxdlVkalFUaVNBaEdqSW9EM1ZSMUR5d0pUbDgxcUJ5cnZ5cDY5YkFhUlJYTStzZ0JINENTbnFjK2tGU1IxZEg2TWlnUGtuUjlvRXozbnVrcFdEZFlOQWdTREFVTCtOTHRhUW1MZDFWMXVSSDZwdXNmQWlHRlk1Q3ZsWmJWbjMwb0NjRDhNQk90L0YyY1RRST0tLVY2ZnZRemluWWNkY2ZyNTJONEpWNmc9PQ%3D%3D--0e7bf64b6d71d668d845f98f35c1f94d239aefc3; _my_site_session=MFE2NWZydk1Fa05PRHpwbWdDNzl3TXJZZHFEa01pdEFSQUdsSWpzN0F0dGx6cklacFZzV2hsaTdITWpubU5PUDdYU1ZZWkZEOUpWb1pIbDUyeDVHR0ZiNDZHU0U4K2V4QnU0K2pRTmdpdWNlUHFvTnZMQ3g3MHBDSEhjV2VKOWRoTEVFUm9NRWdIUzZ1YjFIaE9aVVlnPT0tLWpjVUVuaHJyM0JoWm1GUit0WmFWL2c9PQ%3D%3D--d7711f08ae193bd0528e10198728887b9eedc426; _rails-starter-kit_session=NmRveUJiZ0RMTTlRR003L1RrUE5lem5oMmRjdG5xMmtZcDRlUTFWRjBXNmNPMkFvT1RqSFBPd1pBQVBHSHRLSmg3Qk53WXZ3Ykp6bkQvT2lqa2dyQU5ZYXlJcXBnaEdabzhTSEJteHl5K1lBNzU2R1BMNGx6WGpFa1dOTVpOUS9mZ09LZWJYZlQwMjhRL2xiWFBnVU9BPT0tLUthVEdXNDlQZDREQTd0MWVkU093SUE9PQ%3D%3D--41cea213452b8234f53415d44c98bf55997633be; step-1=60; step-2=140; step-3=0; step-4=13; step-5=30; step-6=26; step-7=26; step-8=0; current-step=9; step-9=0; sid=111; __cypress.initial=false; __cypress.remoteHost=http://localhost:8000; best_fit=14 1/2, 34-35, Traditional',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(200)
      })
    })

    // Set custom status message/reason phrase from http response
    // https://github.com/cypress-io/cypress/issues/16973
    it('set custom status message when reason phrase is set', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/companies/validate', {
        payload: { name: 'Brian' },
      })
      .reply(400, function (uri, requestBody) {
        this.req.response.statusMessage = 'This is the custom status message'

        return {
          status: 400,
          message: 'This is the reply body',
        }
      })

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/companies/validate',
        json: true,
        body: {
          payload: { name: 'Brian' },
        },
        headers: {
          'x-cypress-status': '400',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(400)
        expect(res.statusMessage).to.eq('This is the custom status message')
      })
    })

    // use default status message/reason phrase correspond to status code, from http response
    // https://github.com/cypress-io/cypress/issues/16973
    it('uses default status message when reason phrase is not set', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/companies/validate', {
        payload: { name: 'Brian' },
      })
      .reply(400)

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/companies/validate',
        json: true,
        body: {
          payload: { name: 'Brian' },
        },
        headers: {
          'x-cypress-status': '400',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(400)
        expect(res.statusMessage).to.eq('Bad Request')
      })
    })

    it('hands back 201 status codes', function () {
      nock(this.server.remoteStates.current().origin)
      .post('/companies/validate', {
        payload: { name: 'Brian' },
      })
      .reply(201)

      return this.rp({
        method: 'POST',
        url: 'http://localhost:8000/companies/validate',
        json: true,
        body: {
          payload: { name: 'Brian' },
        },
        headers: {
          'Cookie': '__cypress.initial=false',
        },
      })
      .then((res) => {
        expect(res.statusCode).to.eq(201)
      })
    })
  })
})
