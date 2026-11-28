import _ from 'lodash'
import http from 'http'
import requestPromise from '@cypress/request-promise'
import evilDns from 'evil-dns'
import nock from 'nock'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setupFullConfigWithDefaults } from '@packages/config'
import * as httpsServer from '@packages/https-proxy/test/helpers/https_server'
import Fixtures from '@tooling/system-tests'
import * as config from '../../lib/config'
import { ServerBase } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import { createRoutes } from '../../lib/routes'
import { clearCtx, getCtx, makeDataContext, setCtx } from '../../lib/makeDataContext'
import { GracefulExit } from '../../lib/util/graceful-exit'
import { configureLongStackTraces } from '../../lib/environment'

// `_onResolveUrl` cancels the in-flight request through Bluebird cancellation.
configureLongStackTraces(undefined)

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean }

testGlobals.IS_TEST = true

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const s3StaticHtmlUrl = 'https://s3.amazonaws.com/internal-test-runner-assets.cypress.io/index.html'

const originalEnv = { ...process.env }

const expectToEqDetails = function (actual, expected) {
  actual = _.omit(actual, 'totalTime')

  expect(actual).toStrictEqual(expected)
}

// Stringifies first, so an absent header passes; `not.toMatch` throws on a non-string.
const expectNotToMatch = (actual, re: RegExp) => {
  expect(re.test(String(actual))).toBe(false)
}

const expectNotEmpty = (actual) => {
  expect(Object.keys(actual).length).toBeGreaterThan(0)
}

describe('Server', () => {
  beforeEach(async () => {
    GracefulExit.resetForTesting()
    await clearCtx()
    setCtx(makeDataContext({} as Parameters<typeof makeDataContext>[0]))

    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)
  })

  afterEach(async () => {
    await getCtx()._reset()
    await clearCtx()
    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    process.env = { ...originalEnv }
  })

  beforeEach(() => {
    vi.spyOn(ServerBase.prototype, 'reset').mockImplementation(() => {})
  })

  describe('resolving url', () => {
    let automationRequest: any
    let setup: (initialUrl: any, obj?: any) => Promise<any>
    let rp: (options?: any) => Promise<any>
    let server: any
    let proxy: string
    let buffers: any
    let fileServer: any

    beforeEach(() => {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

      // nock judges a proxied request by its target host, though it only reaches the local proxy
      nock.enableNetConnect()

      automationRequest = vi.fn((message) => {
        if (message === 'get:cookies') {
          return Promise.resolve([])
        }

        if (message === 'set:cookie') {
          return Promise.resolve({})
        }

        return undefined
      })

      setup = (initialUrl, obj = {}) => {
        if (_.isObject(initialUrl)) {
          obj = initialUrl
          initialUrl = null
        }

        // get all the config defaults
        // and allow us to override them
        // for each test
        return setupFullConfigWithDefaults(obj, (...args) => getCtx().file.getFilesByGlob(...args))
        .then((cfg) => {
          // use a jar for each test
          // but reset it automatically
          // between test
          const jar = requestPromise.jar()

          // use a custom request promise
          // to automatically backfill these
          // options including our proxy
          rp = (options = {}) => {
            let url

            if (_.isString(options)) {
              url = options
              options = {}
            }

            _.defaults(options, {
              url,
              proxy,
              jar,
              simple: false,
              followRedirect: false,
              resolveWithFullResponse: true,
            })

            return requestPromise(options)
          }

          return Promise.all([
            // open our https server
            httpsServer.start(8443),

            // and open our cypress server
            (server = new ServerBase(cfg)),

            server.open(cfg, {
              SocketCtor: SocketE2E,
              createRoutes,
              testingType: 'e2e',
              getCurrentBrowser: () => null,
            })
            .then(async ([port]) => {
              const automationStub = {
                use: () => { },
              }

              // these requests arrive in absolute form, and CONNECT for https,
              // like a proxied browser — which only happens on the MITM path,
              // and the server refuses CONNECT until a launch resolves it
              await server.setNetworkMode(false)

              await server.startWebsockets(automationStub, config, {})
              if (initialUrl) {
                server.remoteStates.set(initialUrl)
              }

              proxy = `http://localhost:${port}`

              buffers = server._networkProxy.http.buffers

              fileServer = server._fileServer.address()
            }),
          ])
        })
      }
    })

    afterEach(() => {
      nock.cleanAll()

      evilDns.clear()

      return Promise.all([
        server.close(),
        httpsServer.stop(),
      ])
    })

    describe('file', () => {
      beforeEach(() => {
        Fixtures.scaffold('no-server')

        return setup({
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            port: 2000,
            fileServerFolder: 'dev',
            supportFile: false,
          },
        })
      })

      it('can serve static assets', async () => {
        const obj = await server._onResolveUrl('/index.html', {}, automationRequest)

        await expectToEqDetails(obj, {
          isOkStatusCode: true,
          isPrimarySuperDomainOrigin: true,
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

        const res = await rp('http://localhost:2000/index.html')

        expect(res.statusCode).toBe(200)
        expect(res.headers['etag']).toEqual(expect.anything())
        expectNotToMatch(res.headers['set-cookie'], /initial=;/)
        expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate')
        expect(res.body).toContain('index.html content')
        expect(res.body).toContain('.action("app:window:before:load",window)')
        expect(res.body).toContain('</script>\n  </head>')
      })

      it('sends back the content type', async () => {
        const obj = await server._onResolveUrl('/assets/foo.json', {}, automationRequest)

        await expectToEqDetails(obj, {
          isOkStatusCode: true,
          isPrimarySuperDomainOrigin: true,
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

      it('buffers the response', () => {
        const sendStreamSpy = vi.spyOn(server.request, 'sendStream')

        return server._onResolveUrl('/index.html', {}, automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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

          expect(buffers.buffer).toMatchObject({ url: 'http://localhost:2000/index.html' })
        }).then(() => {
          return server._onResolveUrl('/index.html', {}, automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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

            expect(sendStreamSpy).toHaveBeenCalledTimes(2)
          })
        }).then(() => {
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('Cypress')

            expect(buffers.buffer).toBeUndefined()
          })
        })
      })

      it('can follow static file redirects', () => {
        return server._onResolveUrl('/sub', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/sub/')
          .then((res) => {
            expect(res.statusCode).toBe(200)

            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              origin: 'http://localhost:2000',
              strategy: 'file',
              domainName: 'localhost',
              fileServer: fileServer,
              props: null,
            })
          })
        })
      })

      it('gracefully handles 404', () => {
        return server._onResolveUrl('/does-not-exist', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: false,
            isPrimarySuperDomainOrigin: true,
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
          return rp({
            url: 'http://localhost:2000/does-not-exist',
            headers: {
              'Accept-Encoding': 'identity',
            },
          })
          .then((res) => {
            expect(res.statusCode).toBe(404)
            expect(res.body).toContain('Cypress errored trying to serve this file from your system:')
            expect(res.body).toContain('does-not-exist')

            expect(res.body).toContain('The file was not found')
          })
        })
      })

      it('handles urls with hashes', () => {
        return server._onResolveUrl('/index.html#/foo/bar', {}, automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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

          expect(buffers.buffer).toMatchObject({ url: 'http://localhost:2000/index.html' })
        }).then(() => {
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)

            expect(buffers.buffer).toBeUndefined()
          })
        })
      })
    })

    describe('http', () => {
      beforeEach(() => {
        return setup({
          projectRoot: '/foo/bar/',
          config: {
            port: 2000,
            supportFile: false,
          },
        })
      })

      describe('only having one request in flight at a time', () => {
        let httpServer: any
        let httpPort: number
        let runOneReqTest: (path: string) => Promise<void>

        beforeEach(async () => {
          httpServer = http.createServer((req, res) => {
            const [path, ms] = req.url.split('/').slice(1)

            switch (path) {
              case 'pause-before-body':
                res.writeHead(200, { 'content-type': 'text/html' })

                return setTimeout(() => {
                  res.write('ok')

                  return res.end()
                },
                 Number(ms))
              case 'pause-before-headers':
                return setTimeout(() => {
                  res.writeHead(200, { 'content-type': 'text/html' })
                  res.write('ok')

                  return res.end()
                },
                 Number(ms))
              default:
            }
          })

          const listening = new Promise<void>((resolve) => {
            httpServer.listen(() => {
              httpPort = httpServer.address().port

              return resolve()
            })
          })

          runOneReqTest = (path) => {
            // put the first request in flight
            const p1 = server._onResolveUrl(`http://localhost:${httpPort}/${path}/1000`, {}, automationRequest)

            return delay(100)
            .then(() => {
              // the p1 should not have a current promise phase or reqStream until it's canceled
              expect(p1).not.toHaveProperty('currentPromisePhase')
              expect(p1).not.toHaveProperty('reqStream')

              // fire the 2nd request now that the first one has had some time to reach out
              return server._onResolveUrl(`http://localhost:${httpPort}/${path}/100`, {}, automationRequest)
            }).then((obj) => {
              expectToEqDetails(obj, {
                isOkStatusCode: true,
                isPrimarySuperDomainOrigin: true,
                isHtml: true,
                contentType: 'text/html',
                url: `http://localhost:${httpPort}/${path}/100`,
                originalUrl: `http://localhost:${httpPort}/${path}/100`,
                status: 200,
                statusText: 'OK',
                redirects: [],
                cookies: [],
              })

              expect(p1.isCancelled()).toBe(true)
              expect(p1).toHaveProperty('currentPromisePhase')

              expect(p1.reqStream.aborted).toBe(true)
            })
          }

          await listening
        })

        it('cancels and aborts the 1st request when it hasn\'t loaded headers and a 2nd request is made', () => {
          return runOneReqTest('pause-before-headers')
        })

        it('cancels and aborts the 1st request when it hasn\'t loaded body and a 2nd request is made', () => {
          return runOneReqTest('pause-before-body')
        })
      })

      it('can serve http requests', () => {
        nock('http://getbootstrap.com')
        .matchHeader('user-agent', 'foobarbaz')
        .matchHeader('accept', 'text/html,*/*')
        .get('/')
        .reply(200, '<html>content</html>', {
          'X-Foo-Bar': 'true',
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        })

        const userAgent = 'foobarbaz'

        return server._onResolveUrl('http://getbootstrap.com/', userAgent, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('http://getbootstrap.com/')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expectNotToMatch(res.headers['set-cookie'], /initial=;/)
            expect(res.headers['x-foo-bar']).toBe('true')
            expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate')
            expect(res.body).toContain('content')

            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</head>content</html>')
          })
        })
      })

      it('sends back the content type', () => {
        nock('http://getbootstrap.com')
        .get('/user.json')
        .reply(200, {})

        return server._onResolveUrl('http://getbootstrap.com/user.json', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: false,
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
      it('yields isHtml true for unconventional HTML content-types', async () => {
        const scope = nock('http://example.com')
        .get('/a').reply(200, 'notHtml')
        .get('/b').reply(200, 'notHtml', { 'content-type': 'Text/Html' })
        .get('/c').reply(200, 'notHtml', { 'content-type': 'text/html;charset=utf-8' })
        // invalid, but let's be tolerant
        .get('/d').reply(200, 'notHtml', { 'content-type': 'text/html;' })
        .get('/e').reply(200, 'notHtml', { 'content-type': 'application/xhtml+xml' })
        // invalid headers are matched as sent rather than parsed and lowercased
        .get('/f').reply(200, 'notHtml', { 'content-type': 'Text/HTML;' })
        .get('/g').reply(200, '<html></html>', { 'content-type': 'text/plain; profile=text/html;' })

        for (const path of ['/a', '/g']) {
          const bad = await server._onResolveUrl(`http://example.com${path}`, {}, automationRequest)

          expect(bad.isHtml).toBe(false)
        }

        for (const path of ['/b', '/c', '/d', '/e', '/f']) {
          const details = await server._onResolveUrl(`http://example.com${path}`, {}, automationRequest)

          expect(details.isHtml).toBe(true)
        }

        scope.done()
      })

      it('yields isHtml true for HTML-shaped responses', () => {
        nock('http://example.com')
        .get('/')
        .reply(200, '<html>foo</html>')

        return server._onResolveUrl('http://example.com', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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

      it('yields isHtml false for non-HTML-shaped responses', () => {
        nock('http://example.com')
        .get('/')
        .reply(200, '{ foo: "bar" }')

        return server._onResolveUrl('http://example.com', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: false,
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

      it('can follow multiple http redirects', () => {
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

        return server._onResolveUrl('http://espn.com/', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('http://espn.go.com/')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('content')
            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</head>content</html>')

            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              origin: 'http://espn.go.com',
              strategy: 'http',
              domainName: 'go.com',
              fileServer: null,
              props: {
                domain: 'go',
                tld: 'com',
                port: '80',
                subdomain: 'espn',
                protocol: 'http:',
              },
            })
          })
        })
      })

      it('buffers the http response', () => {
        const sendStreamSpy = vi.spyOn(server.request, 'sendStream')

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

        return server._onResolveUrl('http://espn.com/', {}, automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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

          expect(buffers.buffer).toMatchObject({ url: 'http://espn.go.com/' })
        }).then(() => {
          return server._onResolveUrl('http://espn.com/', {}, automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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

            expect(sendStreamSpy).toHaveBeenCalledTimes(2)
          })
        }).then(() => {
          return rp('http://espn.go.com/')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</script></head><body>espn</body></html>')

            expect(buffers.buffer).toBeUndefined()
          })
        })
      })

      it('does not buffer \'bad\' responses', () => {
        const sendStreamSpy = vi.spyOn(server.request, 'sendStream')

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

        return server._onResolveUrl('http://espn.com/', {}, automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: false,
            isPrimarySuperDomainOrigin: false,
            isHtml: false,
            contentType: undefined,
            url: 'http://espn.com/',
            originalUrl: 'http://espn.com/',
            status: 404,
            statusText: 'Not Found',
            cookies: [],
            redirects: [],
          })

          return server._onResolveUrl('http://espn.com/', {}, automationRequest)
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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

            expect(sendStreamSpy).toHaveBeenCalledTimes(2)
          })
        })
      })

      it('gracefully handles 500', () => {
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

        return server._onResolveUrl('http://mlb.com/', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: false,
            isPrimarySuperDomainOrigin: false,
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

      // `localhost` can resolve to both ::1 and 127.0.0.1, which turns the refusal into an AggregateError
      it('gracefully handles http errors', async () => {
        await expect(server._onResolveUrl('http://127.0.0.1:64646', {}, automationRequest)).rejects.toMatchObject({
          message: 'connect ECONNREFUSED 127.0.0.1:64646',
          port: 64646,
          code: 'ECONNREFUSED',
        })
      })

      it('handles url hashes', () => {
        nock('http://getbootstrap.com')
        .get('/')
        .reply(200, 'content page', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://getbootstrap.com/#/foo', {}, automationRequest)
        .then((obj = {}) => {
          expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://getbootstrap.com/',
            originalUrl: 'http://getbootstrap.com/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })

          expect(buffers.buffer).toMatchObject({ url: 'http://getbootstrap.com/' })
        }).then(() => {
          return rp('http://getbootstrap.com/')
          .then((res) => {
            expect(res.statusCode).toBe(200)

            expect(buffers.buffer).toBeUndefined()
          })
        })
      })

      it('can serve non 2xx status code requests when option set', () => {
        nock('http://cypress.io')
        .matchHeader('user-agent', 'foobarbaz')
        .matchHeader('accept', 'text/html,*/*')
        .get('/foo')
        .reply(404, '<html>content</html>', {
          'X-Foo-Bar': 'true',
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        })

        const userAgent = 'foobarbaz'

        return server._onResolveUrl('http://cypress.io/foo', userAgent, automationRequest, { failOnStatusCode: false })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://cypress.io/foo',
            originalUrl: 'http://cypress.io/foo',
            status: 404,
            statusText: 'Not Found',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return rp('http://cypress.io/foo')
          .then((res) => {
            expect(res.statusCode).toBe(404)
            expectNotToMatch(res.headers['set-cookie'], /initial=;/)
            expect(res.headers['x-foo-bar']).toBe('true')
            expect(res.headers['cache-control']).toBe('no-cache, no-store, must-revalidate')
            expect(res.body).toContain('content')

            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</head>content</html>')
          })
        })
      })

      it('passes auth through', () => {
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

        const userAgent = 'foobarbaz'

        return server._onResolveUrl('http://google.com/index', userAgent, automationRequest, { auth })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('http://google.com/index2')
          .then((res) => {
            expect(res.statusCode).toBe(200)
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth,
            origin: 'http://google.com',
            strategy: 'http',
            domainName: 'google.com',
            fileServer: null,
            props: {
              domain: 'google',
              tld: 'com',
              port: '80',
              subdomain: null,
              protocol: 'http:',
            },
          })
        })
      })

      it('respects Accept-Encoding when passed with Title-Case key in options.headers (HTTP header names are case-insensitive)', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'br')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, {
          headers: { 'Accept-Encoding': 'br' },
        })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('sends accept-encoding: gzip when options.headers includes Accept-Encoding: gzip', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'gzip')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, {
          headers: { 'Accept-Encoding': 'gzip' },
        })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('sends accept-encoding: identity when options.headers includes only unsupported encodings (e.g. deflate, identity)', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'identity')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, {
          headers: { 'Accept-Encoding': 'deflate, identity' },
        })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('sends accept-encoding: gzip,identity when options.headers is empty (no accept-encoding)', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'gzip,identity')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, { headers: {} })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('sends accept-encoding: gzip,identity when options has no headers key (normalizes and uses default)', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'gzip,identity')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, {})
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      it('sends accept-encoding: gzip,br when options.headers includes gzip, deflate, br', () => {
        nock('http://www.cypress.io')
        .get('/')
        .matchHeader('accept-encoding', 'gzip,br')
        .reply(200, '<html>ok</html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, {
          headers: { 'Accept-Encoding': 'gzip, deflate, br' },
        })
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        })
      })

      describe('cross-origin', () => {
        it('adds a remote state and buffers the response when the request is from within cy.origin and the origins match', () => {
          nock('http://www.cypress.io/')
          .get('/')
          .reply(200, '<html>content</html>', {
            'Content-Type': 'text/html',
          })

          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            props: null,
            origin: 'http://localhost:2000',
            strategy: 'file',
            domainName: 'localhost',
            fileServer: fileServer,
          })

          server.remoteStates.set('http://cypress.io', {}, false)

          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            props: {
              domain: 'cypress',
              port: '80',
              tld: 'io',
              subdomain: null,
              protocol: 'http:',
            },
            origin: 'http://cypress.io',
            strategy: 'http',
            domainName: 'cypress.io',
            fileServer: null,
          })

          expect(server.remoteStates.isPrimarySuperDomainOrigin('http://cypress.io')).toBe(false)

          return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest, { isFromSpecBridge: true })
          .then((obj = {}) => {
            expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: false,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://www.cypress.io/',
              originalUrl: 'http://www.cypress.io/',
              status: 200,
              statusText: 'OK',
              cookies: [],
              redirects: [],
            })

            // Verify the cross origin request was buffered
            const buffer = buffers.take('http://www.cypress.io/')

            expectNotEmpty(buffer)
            expect(buffer.urlDoesNotMatchPolicyBasedOnDomain).toBe(true)

            // Verify the secondary remote state is returned
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              props: {
                domain: 'cypress',
                port: '80',
                tld: 'io',
                subdomain: 'www',
                protocol: 'http:',
              },
              origin: 'http://www.cypress.io',
              strategy: 'http',
              domainName: 'cypress.io',
              fileServer: null,
            })
          })
        })

        it('adds a remote state and buffers the response when a url has already been visited and the origins match', () => {
          nock('http://localhost:3500/')
          .get('/')
          .reply(200, '<html>content</html>', {
            'Content-Type': 'text/html',
          })

          // this will be the current origin
          server.remoteStates.set('http://localhost:3500/')

          return server._onResolveUrl('http://localhost:3500/', {}, automationRequest, { hasAlreadyVisitedUrl: true })
          .then((obj = {}) => {
            // Verify the cross origin request was buffered
            const buffer = buffers.take('http://localhost:3500/')

            expectNotEmpty(buffer)

            // Verify the secondary remote state is returned
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              props: {
                domain: '',
                port: '3500',
                tld: 'localhost',
                subdomain: null,
                protocol: 'http:',
              },
              origin: 'http://localhost:3500',
              strategy: 'http',
              domainName: 'localhost',
              fileServer: null,
            })
          })
        })

        it('does set a remote state and buffer the response when a url has already been visited and the origins don\'t match', () => {
          nock('http://localhost:3500/')
          .get('/')
          .reply(200, '<html>content</html>', {
            'Content-Type': 'text/html',
          })

          server.remoteStates.set('http://localhost:3500/')

          // this will be the current origin
          server.remoteStates.set('http://cypress.io', {}, false)

          return server._onResolveUrl('http://localhost:3500/', {}, automationRequest, { hasAlreadyVisitedUrl: true })
          .then(() => {
            // Verify the remote state was not updated
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              props: {
                domain: '',
                port: '3500',
                tld: 'localhost',
                subdomain: null,
                protocol: 'http:',
              },
              origin: 'http://localhost:3500',
              strategy: 'http',
              domainName: 'localhost',
              fileServer: null,
            })

            // Verify the cross origin request was buffered
            const buffer = buffers.take('http://localhost:3500/')

            expectNotEmpty(buffer)
          })
        })

        it('does set a remote state or buffer the response when the request is from within cy.origin and the origins don\'t match', () => {
          nock('http://localhost:3500/')
          .get('/')
          .reply(200, '<html>content</html>', {
            'Content-Type': 'text/html',
          })

          server.remoteStates.set('http://localhost:3500/')

          // this will be the current origin
          server.remoteStates.set('http://cypress.io', {}, false)

          return server._onResolveUrl('http://localhost:3500/', {}, automationRequest, { isFromSpecBridge: true })
          .then(() => {
            // Verify the remote state was not updated
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              props: {
                domain: '',
                port: '3500',
                tld: 'localhost',
                subdomain: null,
                protocol: 'http:',
              },
              origin: 'http://localhost:3500',
              strategy: 'http',
              domainName: 'localhost',
              fileServer: null,
            })

            // Verify the cross origin request was buffered
            const buffer = buffers.take('http://localhost:3500/')

            expectNotEmpty(buffer)
          })
        })
      })
    })

    describe('http with injectDocumentDomain enabled', () => {
      const superDomain = 'cypress.io'
      const secondSuperDomain = 'google.com'
      const origin = `http://www.${superDomain}`
      const sameSuperdomainOrigin = `http://docs.${superDomain}`
      const differentSuperdomainOrigin = `http://www.${secondSuperDomain}`

      const statusCode = 200
      const contentText = 'content'
      const path = '/'

      beforeEach(async () => {
        await setup(origin, {
          projectRoot: '/foo/bar/',
          config: {
            port: 2000,
            supportFile: false,

            injectDocumentDomain: true,

          },
        })

        ;[origin, sameSuperdomainOrigin, differentSuperdomainOrigin].forEach((originToMock) => {
          nock(originToMock).get(path).reply(statusCode, `<html>${contentText}</html>`, {
            'Content-Type': 'text/html',
          })
        })
      })

      describe('when navigating to a different subdomain of the same superdomain without cy.origin', () => {
        it('injects document.domain', async () => {
          const url = `${sameSuperdomainOrigin}${path}`

          await server._onResolveUrl(url, {}, automationRequest)
          const res = await rp(url)

          expect(res.body).toContain(`document.domain = "${superDomain}"`)
        })
      })

      describe('when navigating to a different superdomain with cy.origin', () => {
        it('injects document.domain', async () => {
          const url = `${differentSuperdomainOrigin}${path}`

          server.remoteStates.set(differentSuperdomainOrigin, {}, false)
          await server._onResolveUrl(url, {}, automationRequest)
          const res = await rp(url)

          expect(res.body).toContain(`document.domain = "${secondSuperDomain}"`)
        })
      })

      describe('when navigating to the same origin', () => {
        it('injects document.domain', async () => {
          const url = `${origin}${path}`

          server.remoteStates.set(differentSuperdomainOrigin)
          await server._onResolveUrl(url, {}, automationRequest)
          const res = await rp(url)

          expect(res.body).toContain(`document.domain = "${superDomain}"`)
        })
      })
    })

    describe('both', () => {
      beforeEach(() => {
        Fixtures.scaffold('no-server')

        return setup({
          projectRoot: Fixtures.projectPath('no-server'),
          config: {
            port: 2000,
            fileServerFolder: 'dev',
            supportFile: false,
          },
        })
      })

      it('can go from file -> http -> file', () => {
        nock('http://www.cypress.io')
        .get('/')
        .reply(200, 'content page', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('/index.html', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
          })
        }).then(() => {
          return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest)
        }).then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return rp('http://www.cypress.io/')
          .then((res) => {
            expect(res.statusCode).toBe(200)
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://www.cypress.io',
            strategy: 'http',
            domainName: 'cypress.io',
            fileServer: null,
            props: {
              domain: 'cypress',
              tld: 'io',
              port: '80',
              subdomain: 'www',
              protocol: 'http:',
            },
          })
        }).then(() => {
          return server._onResolveUrl('/index.html', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            domainName: 'localhost',
            fileServer: fileServer,
            props: null,
          })
        })
      })

      it('can go from http -> file -> http', () => {
        nock('http://www.cypress.io')
        .get('/')
        .reply(200, '<html><head></head><body>cypress</body></html>', {
          'Content-Type': 'text/html',
        })
        .get('/')
        .reply(200, '<html><head></head><body>cypress</body></html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
            isHtml: true,
            contentType: 'text/html',
            url: 'http://www.cypress.io/',
            originalUrl: 'http://www.cypress.io/',
            status: 200,
            statusText: 'OK',
            redirects: [],
            cookies: [],
          })
        }).then(() => {
          return rp('http://www.cypress.io/')
          .then((res) => {
            expect(res.statusCode).toBe(200)

            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</script></head><body>cypress</body></html>')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://www.cypress.io',
            strategy: 'http',
            domainName: 'cypress.io',
            fileServer: null,
            props: {
              domain: 'cypress',
              tld: 'io',
              port: '80',
              subdomain: 'www',
              protocol: 'http:',
            },
          })
        }).then(() => {
          return server._onResolveUrl('/index.html', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('.action("app:window:before:load",window)')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            domainName: 'localhost',
            fileServer: fileServer,
            props: null,
          })
        }).then(() => {
          return server._onResolveUrl('http://www.cypress.io/', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
              isHtml: true,
              contentType: 'text/html',
              url: 'http://www.cypress.io/',
              originalUrl: 'http://www.cypress.io/',
              status: 200,
              statusText: 'OK',
              redirects: [],
              cookies: [],
            })
          }).then(() => {
            return rp('http://www.cypress.io/')
            .then((res) => {
              expect(res.statusCode).toBe(200)

              expect(res.body).toContain('.action("app:window:before:load",window)')
              expect(res.body).toContain('</script></head><body>cypress</body></html>')
            })
          }).then(() => {
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              origin: 'http://www.cypress.io',
              strategy: 'http',
              domainName: 'cypress.io',
              fileServer: null,
              props: {
                domain: 'cypress',
                tld: 'io',
                port: '80',
                subdomain: 'www',
                protocol: 'http:',
              },
            })
          })
        })
      })

      it('can go from https -> file -> https', () => {
        evilDns.add('*.foobar.com', '127.0.0.1')

        return server._onResolveUrl('https://www.foobar.com:8443/', {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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
          return rp('https://www.foobar.com:8443/')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('.action("app:window:before:load",window)')
            expect(res.body).toContain('</script></head><body>https server</body></html>')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'https://www.foobar.com:8443',
            strategy: 'http',
            domainName: 'foobar.com',
            fileServer: null,
            props: {
              domain: 'foobar',
              tld: 'com',
              port: '8443',
              subdomain: 'www',
              protocol: 'https:',
            },
          })
        }).then(() => {
          return server._onResolveUrl('/index.html', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('.action("app:window:before:load",window)')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            domainName: 'localhost',
            fileServer: fileServer,
            props: null,
          })
        }).then(() => {
          return server._onResolveUrl('https://www.foobar.com:8443/', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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
            return rp('https://www.foobar.com:8443/')
            .then((res) => {
              expect(res.statusCode).toBe(200)
              expect(res.body).toContain('.action("app:window:before:load",window)')
              expect(res.body).toContain('</script></head><body>https server</body></html>')
            })
          }).then(() => {
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              origin: 'https://www.foobar.com:8443',
              strategy: 'http',
              fileServer: null,
              domainName: 'foobar.com',
              props: {
                domain: 'foobar',
                tld: 'com',
                port: '8443',
                subdomain: 'www',
                protocol: 'https:',
              },
            })
          })
        })
      })

      it('can go from https -> file -> https without a port', { timeout: 5000 }, () => {
        nock.disableNetConnect()
        nock.enableNetConnect(/localhost/)

        nock('https://s3.amazonaws.com')
        .persist()
        .get('/internal-test-runner-assets.cypress.io/index.html')
        .reply(200, '<html><head><title>Cypress</title></head><body></body></html>', {
          'Content-Type': 'text/html',
        })

        return server._onResolveUrl(s3StaticHtmlUrl, {}, automationRequest)
        .then((obj = {}) => {
          return expectToEqDetails(obj, {
            isOkStatusCode: true,
            isPrimarySuperDomainOrigin: true,
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

          return rp(s3StaticHtmlUrl)
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('Cypress')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'https://s3.amazonaws.com',
            strategy: 'http',
            domainName: 's3.amazonaws.com',
            fileServer: null,
            props: {
              domain: '',
              tld: 's3.amazonaws.com',
              port: '443',
              subdomain: null,
              protocol: 'https:',
            },
          })
        }).then(() => {
          return server._onResolveUrl('/index.html', {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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
          return rp('http://localhost:2000/index.html')
          .then((res) => {
            expect(res.statusCode).toBe(200)
            expect(res.body).toContain('.action("app:window:before:load",window)')
          })
        }).then(() => {
          expect(server.remoteStates.current()).toStrictEqual({
            auth: undefined,
            origin: 'http://localhost:2000',
            strategy: 'file',
            domainName: 'localhost',
            fileServer: fileServer,
            props: null,
          })
        }).then(() => {
          return server._onResolveUrl(s3StaticHtmlUrl, {}, automationRequest)
          .then((obj = {}) => {
            return expectToEqDetails(obj, {
              isOkStatusCode: true,
              isPrimarySuperDomainOrigin: true,
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

            return rp(s3StaticHtmlUrl)
            .then((res) => {
              expect(res.statusCode).toBe(200)
              expect(res.body).toContain('Cypress')
            })
          }).then(() => {
            expect(server.remoteStates.current()).toStrictEqual({
              auth: undefined,
              origin: 'https://s3.amazonaws.com',
              strategy: 'http',
              fileServer: null,
              domainName: 's3.amazonaws.com',
              props: {
                domain: '',
                tld: 's3.amazonaws.com',
                port: '443',
                subdomain: null,
                protocol: 'https:',
              },
            })
          })
        })
      })
    })
  })
})
