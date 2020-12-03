import { NetworkProxy } from '../../'
import {
  netStubbingState as _netStubbingState,
  NetStubbingState,
  onNetEvent,
} from '@packages/net-stubbing'
import { defaultMiddleware } from '../../lib/http'
import express from 'express'
import sinon from 'sinon'
import { expect } from 'chai'
import supertest from 'supertest'
import { allowDestroy } from '@packages/network'
import { EventEmitter } from 'events'

const Request = require('@packages/server/lib/request')
const getFixture = async () => {}

context('network stubbing', () => {
  let config
  let remoteState
  let netStubbingState: NetStubbingState
  let app
  let destinationApp
  let server
  let destinationPort
  let socket

  beforeEach((done) => {
    config = {}
    remoteState = {}
    socket = new EventEmitter()
    socket.toDriver = sinon.stub()
    app = express()
    netStubbingState = _netStubbingState()

    const proxy = new NetworkProxy({
      socket,
      netStubbingState,
      config,
      middleware: defaultMiddleware,
      getRemoteState: () => remoteState,
      getFileServerToken: () => 'fake-token',
      request: new Request(),
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
      handlerId: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: false,
      staticResponse: {
        body: 'foo',
      },
      getFixture: async () => {},
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
      handlerId: '1',
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
      handlerId: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: false,
      staticResponse: {
        body: 'foo',
      },
      getFixture: async () => {},
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
      handlerId: '1',
      routeMatcher: {
        url: '*',
      },
      hasInterceptor: true,
      getFixture,
    })

    socket.toDriver.callsFake((_, event, data) => {
      if (event === 'http:request:received') {
        onNetEvent({
          eventName: 'http:request:continue',
          frame: {
            routeHandlerId: '1',
            requestId: data.requestId,
            req: data.req,
            staticResponse: {
              body: 'replaced',
            },
            hasResponseHandler: false,
            tryNextRoute: false,
          },
          state: netStubbingState,
          socket,
          getFixture,
          args: [],
        })
      }
    })

    return supertest(app)
    .get(`/http://localhost:${destinationPort}`)
    .then((res) => {
      expect(res.headers).to.include({
        'access-control-allow-origin': '*',
      })

      expect(res.text).to.eq('replaced')
    })
  })
})
