import { NetworkProxy } from '../../'
import {
  netStubbingState as _netStubbingState,
  NetStubbingState,
  onNetStubbingEvent,
} from '@packages/net-stubbing'
import { defaultMiddleware } from '../../lib/http'
import express from 'express'
import sinon from 'sinon'
import { expect } from 'chai'
import supertest from 'supertest'
import { allowDestroy } from '@packages/network'
import { EventEmitter } from 'events'
import { RemoteStates } from '@packages/server/lib/remote_states'
import { CookieJar } from '@packages/server/lib/util/cookies'

const Request = require('@packages/server/lib/request')
const getFixture = async () => {}

context('network stubbing', () => {
  let config
  let remoteStates: RemoteStates
  let netStubbingState: NetStubbingState
  let app
  let destinationApp
  let server
  let destinationPort
  let socket

  beforeEach((done) => {
    config = {}
    remoteStates = new RemoteStates(() => {})
    socket = new EventEmitter()
    socket.toDriver = sinon.stub()
    app = express()
    netStubbingState = _netStubbingState()

    const proxy = new NetworkProxy({
      socket,
      netStubbingState,
      config,
      middleware: defaultMiddleware,
      getCookieJar: () => new CookieJar(),
      remoteStates,
      getFileServerToken: () => 'fake-token',
      request: new Request(),
      getRenderedHTMLOrigins: () => ({}),
      serverBus: new EventEmitter(),
      requestedWithAndCredentialManager: {
        get () {
          return {
            requestedWith: 'xhr',
            credentialStatus: 'same-origin',
          }
        },
        set () {},
        clear () {},
      },
    })

    app.use((req, res, next) => {
      req.proxiedUrl = req.url = req.url.slice(1)
      req.cookies = {}
      next()
    })

    app.use((req, res) => {
      proxy.handleHttpRequest(req, res)
    })

    destinationApp = express()

    destinationApp.get('/', (req, res) => res.send('it worked'))

    destinationApp.get('/csp-header', (req, res) => {
      const headerName = req.query.headerName

      res.setHeader('content-type', 'text/html')
      res.setHeader(headerName, 'fake-directive fake-value')
      res.send('<foo>bar</foo>')
    })

    destinationApp.get('/csp-header-multiple', (req, res) => {
      const headerName = req.query.headerName

      res.setHeader('content-type', 'text/html')
      res.setHeader(headerName, ['default \'self\'', 'script-src \'self\' localhost'])
      res.send('<foo>bar</foo>')
    })

    server = allowDestroy(destinationApp.listen(() => {
      destinationPort = server.address().port
      remoteStates.set(`http://localhost:${destinationPort}`)
      remoteStates.set(`http://localhost:${destinationPort}/csp-header`)
      remoteStates.set(`http://localhost:${destinationPort}/csp-header-multiple`)
      done()
    }))
  })

  afterEach(() => {
    server.destroy()
  })

  it('can make a vanilla request', (done) => {
    supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .expect('it worked', done)
  })

  it('does not add CORS headers to all responses', () => {
    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .then((res) => {
      expect(res.headers).to.not.have.property('access-control-allow-origin')
    })
  })

  it('adds CORS headers to static stubs', () => {
    netStubbingState.routes.push({
      id: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: false,
      staticResponse: {
        body: 'foo',
      },
      getFixture: async () => {},
      matches: 1,
    })

    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .then((res) => {
      expect(res.headers).to.include({
        'access-control-allow-origin': '*',
        'access-control-allow-credentials': 'true',
      })

      expect(res.text).to.eq('foo')
    })
  })

  it('does not override CORS headers', () => {
    netStubbingState.routes.push({
      id: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: false,
      staticResponse: {
        body: 'foo',
        headers: {
          'access-control-allow-origin': 'something',
        },
      },
      getFixture: async () => {},
      matches: 1,
    })

    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .then((res) => {
      expect(res.headers).to.include({
        'access-control-allow-origin': 'something',
      })
    })
  })

  it('uses Origin to set CORS header', () => {
    netStubbingState.routes.push({
      id: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: false,
      staticResponse: {
        body: 'foo',
      },
      getFixture: async () => {},
      matches: 1,
    })

    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .set('Origin', 'http://foo.com')
    .then((res) => {
      expect(res.headers).to.include({
        'access-control-allow-origin': 'http://foo.com',
      })
    })
  })

  it('adds CORS headers to dynamically intercepted requests', () => {
    netStubbingState.routes.push({
      id: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: true,
      getFixture,
      matches: 1,
    })

    socket.toDriver.callsFake((_, event, data) => {
      if (event === 'before:request') {
        onNetStubbingEvent({
          eventName: 'send:static:response',
          // @ts-ignore
          frame: {
            requestId: data.requestId,
            staticResponse: {
              ...data.data,
              body: 'replaced',
            },
          },
          state: netStubbingState,
          getFixture,
          args: [],
          socket: {
            toDriver () {},
          },
        })
      }
    })

    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .then((res) => {
      expect(res.text).to.eq('replaced')
      expect(res.headers).to.include({
        'access-control-allow-origin': '*',
      })
    })
  })

  it('does not modify multipart/form-data files', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    let sendContentLength = ''
    let receivedContentLength = ''
    let realContentLength = ''

    destinationApp.post('/', (req, res) => {
      const chunks: Buffer[] = []

      req.on('data', (chunk) => {
        chunks.push(chunk)
      })

      req.on('error', (error) => {
        throw error
      })

      req.on('end', () => {
        realContentLength = Buffer.byteLength(Buffer.concat(chunks)).toString()
        receivedContentLength = req.headers['content-length']
        res.send('ok')
      })
    })

    // capture unintercepted content-length
    await supertest(app)
    .post(`/http://localhost:${destinationPort}`)
    .attach('file', png)

    netStubbingState.routes.push({
      id: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: true,
      getFixture,
      matches: 1,
    })

    socket.toDriver.callsFake((_, event, data) => {
      if (event === 'before:request') {
        sendContentLength = data.data.headers['content-length']
        onNetStubbingEvent({
          eventName: 'send:static:response',
          // @ts-ignore
          frame: {
            requestId: data.requestId,
            staticResponse: {
              ...data.data,
            },
          },
          state: netStubbingState,
          getFixture,
          args: [],
          socket: {
            toDriver () {},
          },
        })
      }
    })

    // capture content-length after intercepting
    await supertest(app)
    .post(`/http://localhost:${destinationPort}`)
    .attach('file', png)

    expect(sendContentLength).to.eq(receivedContentLength)
    expect(sendContentLength).to.eq(realContentLength)
  })

  describe('CSP Headers', () => {
    // Loop through valid CSP header names can verify that we handle them
    [
      'content-security-policy',
      'Content-Security-Policy',
      'content-security-policy-report-only',
      'Content-Security-Policy-Report-Only',
    ].forEach((headerName) => {
      describe(`${headerName}`, () => {
        it('does not add CSP header if injecting JS and original response had no CSP header', () => {
          netStubbingState.routes.push({
            id: '1',
            routeMatcher: {
              url: '*',
            },
            hasInterceptor: false,
            staticResponse: {
              body: '<foo>bar</foo>',
            },
            getFixture: async () => {},
            matches: 1,
          })

          return supertest(app)
          .get(`/http://localhost:${destinationPort}`)
          .set('Accept', 'text/html,application/xhtml+xml')
          .then((res) => {
            expect(res.headers[headerName]).to.be.undefined
            expect(res.headers[headerName.toLowerCase()]).to.be.undefined
          })
        })

        it('does not modify CSP header if not injecting JS and original response had CSP header', () => {
          return supertest(app)
          .get(`/http://localhost:${destinationPort}/csp-header?headerName=${headerName}`)
          .then((res) => {
            expect(res.headers[headerName.toLowerCase()]).to.equal('fake-directive fake-value')
          })
        })

        it('modifies CSP header if injecting JS and original response had CSP header', () => {
          return supertest(app)
          .get(`/http://localhost:${destinationPort}/csp-header?headerName=${headerName}`)
          .set('Accept', 'text/html,application/xhtml+xml')
          .then((res) => {
            expect(res.headers[headerName.toLowerCase()]).to.match(/^fake-directive fake-value; script-src 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'/)
          })
        })

        it('modifies CSP header if injecting JS and original response had multiple CSP headers', () => {
          return supertest(app)
          .get(`/http://localhost:${destinationPort}/csp-header-multiple?headerName=${headerName}`)
          .set('Accept', 'text/html,application/xhtml+xml')
          .then((res) => {
            expect(res.headers[headerName.toLowerCase()]).to.match(/default 'self'; script-src 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'/)
            expect(res.headers[headerName.toLowerCase()]).to.match(/script-src 'self' localhost 'nonce-[^-A-Za-z0-9+/=]|=[^=]|={3,}'/)
          })
        })

        if (headerName !== headerName.toLowerCase()) {
          // Do not add a non-lowercase version of a CSP header, because most-restrictive is used
          it('removes non-lowercase CSP header to avoid conflicts on unmodified CSP headers', () => {
            return supertest(app)
            .get(`/http://localhost:${destinationPort}/csp-header?headerName=${headerName}`)
            .then((res) => {
              expect(res.headers[headerName]).to.be.undefined
            })
          })

          it('removes non-lowercase CSP header to avoid conflicts on modified CSP headers', () => {
            return supertest(app)
            .get(`/http://localhost:${destinationPort}/csp-header?headerName=${headerName}`)
            .set('Accept', 'text/html,application/xhtml+xml')
            .then((res) => {
              expect(res.headers[headerName]).to.be.undefined
            })
          })

          it('removes non-lowercase CSP header to avoid conflicts on multiple CSP headers', () => {
            return supertest(app)
            .get(`/http://localhost:${destinationPort}/csp-header-multiple?headerName=${headerName}`)
            .set('Accept', 'text/html,application/xhtml+xml')
            .then((res) => {
              expect(res.headers[headerName]).to.be.undefined
            })
          })
        }
      })
    })
  })
})
