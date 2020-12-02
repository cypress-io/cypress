require('../spec_helper')

const _ = require('lodash')
const http = require('http')
const rp = require('@cypress/request-promise')
const Promise = require('bluebird')
const evilDns = require('evil-dns')
const httpsServer = require(`${root}../https-proxy/test/helpers/https_server`)
const config = require(`${root}lib/config`)
const Server = require(`${root}lib/server`)
const Fixtures = require(`${root}test/support/helpers/fixtures`)

const s3StaticHtmlUrl = 'https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/index.html'

const expectToEqDetails = function (actual, expected) {
  actual = _.omit(actual, 'totalTime')

  expect(actual).to.deep.eq(expected)
}

describe('Server', () => {
  require('mocha-banner').register()

  beforeEach(() => {
    return sinon.stub(Server.prototype, 'reset')
  })

  context('resolving url', () => {
    beforeEach(function () {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

      nock.enableNetConnect()

      this.automationRequest = sinon.stub()
      this.automationRequest.withArgs('get:cookies').resolves([])
      this.automationRequest.withArgs('set:cookie').resolves({})

      this.setup = (initialUrl, obj = {}) => {
        if (_.isObject(initialUrl)) {
          obj = initialUrl
          initialUrl = null
        }

        // get all the config defaults
        // and allow us to override them
        // for each test
        return config.set(obj)
        .then((cfg) => {
          // use a jar for each test
          // but reset it automatically
          // between test
          const jar = rp.jar()

          // use a custom request promise
          // to automatically backfill these
          // options including our proxy
          this.rp = (options = {}) => {
            let url

            if (_.isString(options)) {
              url = options
              options = {}
            }

            _.defaults(options, {
              url,
              proxy: this.proxy,
              jar,
              simple: false,
              followRedirect: false,
              resolveWithFullResponse: true,
            })

            return rp(options)
          }

          return Promise.all([
            // open our https server
            httpsServer.start(8443),

            // and open our cypress server
            (this.server = new Server()),

            this.server.open(cfg)
            .spread((port) => {
              if (initialUrl) {
                this.server._onDomainSet(initialUrl)
              }

              this.srv = this.server.getHttpServer()

              // @session = new (Session({app: @srv}))

              this.proxy = `http://localhost:${port}`

              this.buffers = this.server._networkProxy.http.buffers

              this.fileServer = this.server._fileServer.address()
            }),
          ])
        })
      }
    })

    afterEach(function () {
      nock.cleanAll()

      evilDns.clear()

      return Promise.join(
        this.server.close(),
        httpsServer.stop(),
      )
    })

    describe('file', () => {
      beforeEach(function () {
        Fixtures.scaffold('no-server')

        return this.setup({
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            port: 2000,
            fileServerFolder: 'dev',
          },
        })
      })

      it('can serve static assets', function () {
        return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/index.html',
            originalUrl: '/index.html',
            filePath: Fixtures.projectPath('no-server/dev/index.html'),
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers['etag']).to.exist
            expect(res.headers['set-cookie']).not.to.match(/initial=;/)
            expect(res.headers['cache-control']).to.eq('no-cache, no-store, must-revalidate')
            expect(res.body).to.include('index.html content')
            expect(res.body).to.include('document.domain = \'localhost\'')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script>\n  </head>')
          })
        })
      })

      it('sends back the content type', function () {
        return this.server._onResolveUrl('/assets/foo.json', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: false,
            contentType: 'application/json',
            url: 'http://localhost:2000/assets/foo.json',
            originalUrl: '/assets/foo.json',
            filePath: Fixtures.projectPath('no-server/dev/assets/foo.json'),
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('buffers the response', function () {
        sinon.spy(this.server._request, 'sendStream')

        return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/index.html',
            originalUrl: '/index.html',
            filePath: Fixtures.projectPath('no-server/dev/index.html'),
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })

          expect(this.buffers.buffer).to.include({ url: 'http://localhost:2000/index.html' })
        }).then(() => {
          return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://localhost:2000/index.html',
              originalUrl: '/index.html',
              filePath: Fixtures.projectPath('no-server/dev/index.html'),
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })

            expect(this.server._request.sendStream).to.be.calledTwice
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('localhost')
            expect(res.body).to.include('Cypress')

            expect(this.buffers.buffer).to.be.undefined
          })
        })
      })

      it('can follow static file redirects', function () {
        return this.server._onResolveUrl('/sub', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/sub/',
            originalUrl: '/sub',
            filePath: Fixtures.projectPath('no-server/dev/sub/'),
            status: 200,
            statusText: 'OK',
            redirects: ['301: http://localhost:2000/sub/'],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://localhost:2000/sub/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(this.server._getRemoteState()).to.deep.eq({
              auth: undefined,
              origin: 'http://localhost:2000',
              strategy: 'file',
              visiting: false,
              domainName: 'localhost',
              fileServer: this.fileServer,
              props: null,
            })
          })
        })
      })

      it('gracefully handles 404', function () {
        return this.server._onResolveUrl('/does-not-exist', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: false,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/does-not-exist',
            originalUrl: '/does-not-exist',
            filePath: Fixtures.projectPath('no-server/dev/does-not-exist'),
            status: 404,
            statusText: 'Not Found',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://localhost:2000/does-not-exist')
          .then((res) => {
            expect(res.statusCode).to.eq(404)
            expect(res.body).to.include('Cypress errored trying to serve this file from your system:')
            expect(res.body).to.include('does-not-exist')

            expect(res.body).to.include('The file was not found')
          })
        })
      })

      it('handles urls with hashes', function () {
        return this.server._onResolveUrl('/index.html#/foo/bar', {}, this.automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/index.html',
            originalUrl: '/index.html',
            filePath: Fixtures.projectPath('no-server/dev/index.html'),
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })

          expect(this.buffers.buffer).to.include({ url: 'http://localhost:2000/index.html' })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(this.buffers.buffer).to.be.undefined
          })
        })
      })
    })

    describe('http', () => {
      beforeEach(function () {
        return this.setup({
          projectRoot: '/foo/bar/',
          config: {
            port: 2000,
          },
        })
      })

      context('only having one request in flight at a time', () => {
        beforeEach(function (done) {
          this.httpServer = http.createServer((req, res) => {
            const [path, ms] = req.url.split('/').slice(1)

            switch (path) {
              case 'pause-before-body':
                res.writeHead(200, { 'content-type': 'text/html' })

                return setTimeout(() => {
                  res.write('ok')

                  return res.end()
                }
                , Number(ms))
              case 'pause-before-headers':
                return setTimeout(() => {
                  res.writeHead(200, { 'content-type': 'text/html' })
                  res.write('ok')

                  return res.end()
                }
                , Number(ms))
              default:
            }
          })

          this.httpServer.listen(() => {
            this.httpPort = this.httpServer.address().port

            return done()
          })

          this.runOneReqTest = (path) => {
            // put the first request in flight
            const p1 = this.server._onResolveUrl(`http://localhost:${this.httpPort}/${path}/1000`, {}, this.automationRequest)

            return Promise.delay(100)
            .then(() => {
              // the p1 should not have a current promise phase or reqStream until it's canceled
              expect(p1).not.to.have.property('currentPromisePhase')
              expect(p1).not.to.have.property('reqStream')

              // fire the 2nd request now that the first one has had some time to reach out
              return this.server._onResolveUrl(`http://localhost:${this.httpPort}/${path}/100`, {}, this.automationRequest)
            }).then((obj) => {
              expectToEqDetails(obj, {
                isOkStatusCode: true,
                isHtml: true,
                contentType: 'text/html',
                url: `http://localhost:${this.httpPort}/${path}/100`,
                originalUrl: `http://localhost:${this.httpPort}/${path}/100`,
                status: 200,
                statusText: 'OK',
                redirects: [],
                cookies: [],
              })

              expect(p1.isCancelled()).to.be.true
              expect(p1).to.have.property('currentPromisePhase')

              expect(p1.reqStream.aborted).to.be.true
            })
          }
        })

        it('cancels and aborts the 1st request when it hasn\'t loaded headers and a 2nd request is made', function () {
          return this.runOneReqTest('pause-before-headers')
        })

        it('cancels and aborts the 1st request when it hasn\'t loaded body and a 2nd request is made', function () {
          return this.runOneReqTest('pause-before-body')
        })
      })

      it('can serve http requests', function () {
        nock('http://getbootstrap.com')
        .matchHeader('user-agent', 'foobarbaz')
        .matchHeader('accept', 'text/html,*/*')
        .get('/')
        .reply(200, '<html>content</html>', {
          'X-Foo-Bar': 'true',
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        })

        const headers = {}

        headers['user-agent'] = 'foobarbaz'

        return this.server._onResolveUrl('http://getbootstrap.com/', headers, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://getbootstrap.com/',
            originalUrl: 'http://getbootstrap.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://getbootstrap.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.headers['set-cookie']).not.to.match(/initial=;/)
            expect(res.headers['x-foo-bar']).to.eq('true')
            expect(res.headers['cache-control']).to.eq('no-cache, no-store, must-revalidate')
            expect(res.body).to.include('content')
            expect(res.body).to.include('document.domain = \'getbootstrap.com\'')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script> </head>content</html>')
          })
        })
      })

      it('sends back the content type', function () {
        nock('http://getbootstrap.com')
        .get('/user.json')
        .reply(200, {})

        return this.server._onResolveUrl('http://getbootstrap.com/user.json', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: false,
            contentType: 'application/json',
            url: 'http://getbootstrap.com/user.json',
            originalUrl: 'http://getbootstrap.com/user.json',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      // @see https://github.com/cypress-io/cypress/issues/8506
      it('yields isHtml true for unconventional HTML content-types', async function () {
        const scope = nock('http://example.com')
        .get('/a').reply(200, 'notHtml')
        .get('/b').reply(200, 'notHtml', { 'content-type': 'Text/Html' })
        .get('/c').reply(200, 'notHtml', { 'content-type': 'text/html;charset=utf-8' })
        // invalid, but let's be tolerant
        .get('/d').reply(200, 'notHtml', { 'content-type': 'text/html;' })

        const bad = await this.server._onResolveUrl('http://example.com/a', {}, this.automationRequest)

        expect(bad.isHtml).to.be.false

        for (const path of ['/b', '/c', '/d']) {
          const details = await this.server._onResolveUrl(`http://example.com${path}`, {}, this.automationRequest)

          expect(details.isHtml).to.be.true
        }

        scope.done()
      })

      it('yields isHtml true for HTML-shaped responses', function () {
        nock('http://example.com')
        .get('/')
        .reply(200, '<html>foo</html>')

        return this.server._onResolveUrl('http://example.com', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: undefined,
            url: 'http://example.com/',
            originalUrl: 'http://example.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('yields isHtml false for non-HTML-shaped responses', function () {
        nock('http://example.com')
        .get('/')
        .reply(200, '{ foo: "bar" }')

        return this.server._onResolveUrl('http://example.com', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: false,
            contentType: undefined,
            url: 'http://example.com/',
            originalUrl: 'http://example.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('can follow multiple http redirects', function () {
        nock('http://espn.com')
        .get('/')
        .reply(301, undefined, {
          'Location': '/foo',
        })
        .get('/foo')
        .reply(302, undefined, {
          'Location': 'http://espn.go.com/',
        })

        nock('http://espn.go.com')
        .get('/')
        .reply(200, '<html>content</html>', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://espn.com/', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://espn.go.com/',
            originalUrl: 'http://espn.com/',
            status: 200,
            statusText: 'OK',
            cookies: [],
            redirects: [
              '301: http://espn.com/foo',
              '302: http://espn.go.com/',
            ],
          })
        }).then(() => {
          return this.rp('http://espn.go.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('content')
            expect(res.body).to.include('document.domain = \'go.com\'')
            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script> </head>content</html>')

            expect(this.server._getRemoteState()).to.deep.eq({
              auth: undefined,
              origin: 'http://espn.go.com',
              strategy: 'http',
              visiting: false,
              domainName: 'go.com',
              fileServer: null,
              props: {
                domain: 'go',
                tld: 'com',
                port: '80',
              },
            })
          })
        })
      })

      it('buffers the http response', function () {
        sinon.spy(this.server._request, 'sendStream')

        nock('http://espn.com')
        .get('/')
        .times(2)
        .reply(301, undefined, {
          'Location': '/foo',
        })
        .get('/foo')
        .times(2)
        .reply(302, undefined, {
          'Location': 'http://espn.go.com/',
        })

        nock('http://espn.go.com')
        .get('/')
        .times(2)
        .reply(200, '<html><head></head><body>espn</body></html>', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://espn.com/', {}, this.automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://espn.go.com/',
            originalUrl: 'http://espn.com/',
            status: 200,
            statusText: 'OK',
            cookies: [],
            redirects: [
              '301: http://espn.com/foo',
              '302: http://espn.go.com/',
            ],
          })

          expect(this.buffers.buffer).to.include({ url: 'http://espn.go.com/' })
        }).then(() => {
          return this.server._onResolveUrl('http://espn.com/', {}, this.automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://espn.go.com/',
              originalUrl: 'http://espn.com/',
              status: 200,
              statusText: 'OK',
              cookies: [],
              redirects: [
                '301: http://espn.com/foo',
                '302: http://espn.go.com/',
              ],
            })

            expect(this.server._request.sendStream).to.be.calledTwice
          })
        }).then(() => {
          return this.rp('http://espn.go.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('go.com')
            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script></head><body>espn</body></html>')

            expect(this.buffers.buffer).to.be.undefined
          })
        })
      })

      it('does not buffer \'bad\' responses', function () {
        sinon.spy(this.server._request, 'sendStream')

        nock('http://espn.com')
        .get('/')
        .reply(404, undefined)
        .get('/')
        .reply(301, undefined, {
          'Location': '/foo',
        })
        .get('/foo')
        .reply(301, undefined, {
          'Location': 'http://espn.go.com/',
        })

        nock('http://espn.go.com')
        .get('/')
        .reply(200, 'content', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://espn.com/', {}, this.automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: false,
            isHtml: false,
            contentType: undefined,
            url: 'http://espn.com/',
            originalUrl: 'http://espn.com/',
            status: 404,
            statusText: 'Not Found',
            cookies: [],
            redirects: [],
          })

          return this.server._onResolveUrl('http://espn.com/', {}, this.automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://espn.go.com/',
              originalUrl: 'http://espn.com/',
              status: 200,
              statusText: 'OK',
              cookies: [],
              redirects: [
                '301: http://espn.com/foo',
                '301: http://espn.go.com/',
              ],
            })

            expect(this.server._request.sendStream).to.be.calledTwice
          })
        })
      })

      it('gracefully handles 500', function () {
        nock('http://mlb.com')
        .get('/')
        .reply(307, undefined, {
          'Location': 'http://mlb.mlb.com/',
        })

        nock('http://mlb.mlb.com')
        .get('/')
        .reply(500, undefined, {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://mlb.com/', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: false,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://mlb.mlb.com/',
            originalUrl: 'http://mlb.com/',
            status: 500,
            statusText: 'Internal Server Error',
            cookies: [],
            redirects: ['307: http://mlb.mlb.com/'],
          })
        })
      })

      it('gracefully handles http errors', function () {
        return this.server._onResolveUrl('http://localhost:64646', {}, this.automationRequest)
        .catch((err) => {
          expect(err.message).to.eq('connect ECONNREFUSED 127.0.0.1:64646')
          expect(err.port).to.eq(64646)

          expect(err.code).to.eq('ECONNREFUSED')
        })
      })

      it('handles url hashes', function () {
        nock('http://getbootstrap.com')
        .get('/')
        .reply(200, 'content page', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://getbootstrap.com/#/foo', {}, this.automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://getbootstrap.com/',
            originalUrl: 'http://getbootstrap.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })

          expect(this.buffers.buffer).to.include({ url: 'http://getbootstrap.com/' })
        }).then(() => {
          return this.rp('http://getbootstrap.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)

            expect(this.buffers.buffer).to.be.undefined
          })
        })
      })

      it('can serve non 2xx status code requests when option set', function () {
        nock('http://google.com')
        .matchHeader('user-agent', 'foobarbaz')
        .matchHeader('accept', 'text/html,*/*')
        .get('/foo')
        .reply(404, '<html>content</html>', {
          'X-Foo-Bar': 'true',
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        })

        const headers = {}

        headers['user-agent'] = 'foobarbaz'

        return this.server._onResolveUrl('http://google.com/foo', headers, this.automationRequest, { failOnStatusCode: false })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://google.com/foo',
            originalUrl: 'http://google.com/foo',
            status: 404,
            statusText: 'Not Found',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://google.com/foo')
          .then((res) => {
            expect(res.statusCode).to.eq(404)
            expect(res.headers['set-cookie']).not.to.match(/initial=;/)
            expect(res.headers['x-foo-bar']).to.eq('true')
            expect(res.headers['cache-control']).to.eq('no-cache, no-store, must-revalidate')
            expect(res.body).to.include('content')
            expect(res.body).to.include('document.domain = \'google.com\'')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script> </head>content</html>')
          })
        })
      })

      it('passes auth through', function () {
        const username = 'u'
        const password = 'p'

        const base64 = Buffer.from(`${username}:${password}`).toString('base64')

        const auth = {
          username,
          password,
        }

        nock('http://google.com')
        .get('/index')
        .matchHeader('authorization', `Basic ${base64}`)
        .reply(200, '<html>content</html>', {
          'Content-Type': 'text/html',
        })
        .get('/index2')
        .matchHeader('authorization', `Basic ${base64}`)
        .reply(200, '<html>content</html>', {
          'Content-Type': 'text/html',
        })

        const headers = {}

        headers['user-agent'] = 'foobarbaz'

        return this.server._onResolveUrl('http://google.com/index', headers, this.automationRequest, { auth })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://google.com/index',
            originalUrl: 'http://google.com/index',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://google.com/index2')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth,
            origin: 'http://google.com',
            strategy: 'http',
            visiting: false,
            domainName: 'google.com',
            fileServer: null,
            props: {
              domain: 'google',
              tld: 'com',
              port: '80',
            },
          })
        })
      })
    })

    describe('both', () => {
      beforeEach(function () {
        Fixtures.scaffold('no-server')

        return this.setup({
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            port: 2000,
            fileServerFolder: 'dev',
          },
        })
      })

      it('can go from file -> http -> file', function () {
        nock('http://www.google.com')
        .get('/')
        .reply(200, 'content page', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://localhost:2000/index.html',
            originalUrl: '/index.html',
            filePath: Fixtures.projectPath('no-server/dev/index.html'),
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        }).then(() => {
          return this.server._onResolveUrl('http://www.google.com/', {}, this.automationRequest)
        }).then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.google.com/',
            originalUrl: 'http://www.google.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://www.google.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://www.google.com',
            strategy: 'http',
            visiting: false,
            domainName: 'google.com',
            fileServer: null,
            props: {
              domain: 'google',
              tld: 'com',
              port: '80',
            },
          })
        }).then(() => {
          return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://localhost:2000/index.html',
              originalUrl: '/index.html',
              filePath: Fixtures.projectPath('no-server/dev/index.html'),
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            visiting: false,
            domainName: 'localhost',
            fileServer: this.fileServer,
            props: null,
          })
        })
      })

      it('can go from http -> file -> http', function () {
        nock('http://www.google.com')
        .get('/')
        .reply(200, '<html><head></head><body>google</body></html>', {
          'Content-Type': 'text/html',
        })
        .get('/')
        .reply(200, '<html><head></head><body>google</body></html>', {
          'Content-Type': 'text/html',
        })

        return this.server._onResolveUrl('http://www.google.com/', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.google.com/',
            originalUrl: 'http://www.google.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('http://www.google.com/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('google.com')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script></head><body>google</body></html>')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://www.google.com',
            strategy: 'http',
            visiting: false,
            domainName: 'google.com',
            fileServer: null,
            props: {
              domain: 'google',
              tld: 'com',
              port: '80',
            },
          })
        }).then(() => {
          return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://localhost:2000/index.html',
              originalUrl: '/index.html',
              filePath: Fixtures.projectPath('no-server/dev/index.html'),
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('localhost')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script>\n  </head>')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            visiting: false,
            domainName: 'localhost',
            fileServer: this.fileServer,
            props: null,
          })
        }).then(() => {
          return this.server._onResolveUrl('http://www.google.com/', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://www.google.com/',
              originalUrl: 'http://www.google.com/',
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          }).then(() => {
            return this.rp('http://www.google.com/')
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include('document.domain')
              expect(res.body).to.include('google.com')

              expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script></head><body>google</body></html>')
            })
          }).then(() => {
            expect(this.server._getRemoteState()).to.deep.eq({
              auth: undefined,
              origin: 'http://www.google.com',
              strategy: 'http',
              visiting: false,
              domainName: 'google.com',
              fileServer: null,
              props: {
                domain: 'google',
                tld: 'com',
                port: '80',
              },
            })
          })
        })
      })

      it('can go from https -> file -> https', function () {
        evilDns.add('*.foobar.com', '127.0.0.1')

        return this.server._onResolveUrl('https://www.foobar.com:8443/', {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'https://www.foobar.com:8443/',
            originalUrl: 'https://www.foobar.com:8443/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return this.rp('https://www.foobar.com:8443/')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('foobar.com')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script></head><body>https server</body></html>')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'https://www.foobar.com:8443',
            strategy: 'http',
            visiting: false,
            domainName: 'foobar.com',
            fileServer: null,
            props: {
              domain: 'foobar',
              tld: 'com',
              port: '8443',
            },
          })
        }).then(() => {
          return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://localhost:2000/index.html',
              originalUrl: '/index.html',
              filePath: Fixtures.projectPath('no-server/dev/index.html'),
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('localhost')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script>\n  </head>')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            visiting: false,
            domainName: 'localhost',
            fileServer: this.fileServer,
            props: null,
          })
        }).then(() => {
          return this.server._onResolveUrl('https://www.foobar.com:8443/', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'https://www.foobar.com:8443/',
              originalUrl: 'https://www.foobar.com:8443/',
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          }).then(() => {
            return this.rp('https://www.foobar.com:8443/')
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include('document.domain')
              expect(res.body).to.include('foobar.com')

              expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script></head><body>https server</body></html>')
            })
          }).then(() => {
            expect(this.server._getRemoteState()).to.deep.eq({
              auth: undefined,
              origin: 'https://www.foobar.com:8443',
              strategy: 'http',
              visiting: false,
              fileServer: null,
              domainName: 'foobar.com',
              props: {
                domain: 'foobar',
                tld: 'com',
                port: '8443',
              },
            })
          })
        })
      })

      it('can go from https -> file -> https without a port', function () {
        this.timeout(5000)

        return this.server._onResolveUrl(s3StaticHtmlUrl, {}, this.automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isHtml: true,
            contentType: 'text/html',
            url: s3StaticHtmlUrl,
            originalUrl: s3StaticHtmlUrl,
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          // @server.onRequest (req, res) ->
          //   console.log "ON REQUEST!!!!!!!!!!!!!!!!!!!!!!"

          //   nock("https://s3.amazonaws.com")
          //   .get("/internal-test-runner-assets.cypress.io/index.html")
          //   .reply 200, "<html><head></head><body>jsonplaceholder</body></html>", {
          //     "Content-Type": "text/html"
          //   }

          return this.rp(s3StaticHtmlUrl)
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('amazonaws.com')

            expect(res.body).to.include('Cypress')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'https://s3.amazonaws.com',
            strategy: 'http',
            visiting: false,
            domainName: 's3.amazonaws.com',
            fileServer: null,
            props: {
              domain: '',
              tld: 's3.amazonaws.com',
              port: '443',
            },
          })
        }).then(() => {
          return this.server._onResolveUrl('/index.html', {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://localhost:2000/index.html',
              originalUrl: '/index.html',
              filePath: Fixtures.projectPath('no-server/dev/index.html'),
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          })
        }).then(() => {
          return this.rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).to.eq(200)
            expect(res.body).to.include('document.domain')
            expect(res.body).to.include('localhost')

            expect(res.body).to.include('Cypress.action(\'app:window:before:load\', window); </script>\n  </head>')
          })
        }).then(() => {
          expect(this.server._getRemoteState()).to.deep.eq({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            visiting: false,
            domainName: 'localhost',
            fileServer: this.fileServer,
            props: null,
          })
        }).then(() => {
          return this.server._onResolveUrl(s3StaticHtmlUrl, {}, this.automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isHtml: true,
              contentType: 'text/html',
              url: s3StaticHtmlUrl,
              originalUrl: s3StaticHtmlUrl,
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          }).then(() => {
            // @server.onNextRequest (req, res) ->
            //   nock("https://s3.amazonaws.com")
            //   .get("/internal-test-runner-assets.cypress.io/index.html")
            //   .reply 200, "<html><head></head><body>jsonplaceholder</body></html>", {
            //     "Content-Type": "text/html"
            //   }

            return this.rp(s3StaticHtmlUrl)
            .then((res) => {
              expect(res.statusCode).to.eq(200)
              expect(res.body).to.include('document.domain')
              expect(res.body).to.include('amazonaws.com')

              expect(res.body).to.include('Cypress')
            })
          }).then(() => {
            expect(this.server._getRemoteState()).to.deep.eq({
              auth: undefined,
              origin: 'https://s3.amazonaws.com',
              strategy: 'http',
              visiting: false,
              fileServer: null,
              domainName: 's3.amazonaws.com',
              props: {
                domain: '',
                tld: 's3.amazonaws.com',
                port: '443',
              },
            })
          })
        })
      })
    })
  })
})
