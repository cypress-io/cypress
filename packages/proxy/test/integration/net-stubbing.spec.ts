import { NetworkProxy, RequestResourceType } from '../../'
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
      resourceTypeAndCredentialManager: {
        get (url: string, optionalResourceType?: RequestResourceType) {
          return {
            resourceType: 'xhr',
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

    server = allowDestroy(destinationApp.listen(() => {
      destinationPort = server.address().port
      remoteStates.set(`http://localhost:${destinationPort}`)
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
      const chunks = []

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
})
