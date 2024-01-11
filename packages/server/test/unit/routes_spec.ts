import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '../../lib/remote_states'

import chai, { expect } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Cfg } from '../../lib/project-base'

chai.use(require('@cypress/sinon-chai'))

describe('lib/routes', () => {
  // https://github.com/cypress-io/cypress/issues/25891
  describe('https upgrade fix', () => {
    let routeOptions

    beforeEach(() => {
      sinon.restore()

      routeOptions = {
        config: {
          clientRoute: '/__/',
          namespace: 'namespace',
        } as Cfg,
        getSpec: sinon.stub().returns({}),
        // @ts-expect-error
        networkProxy: {
          handleHttpRequest: () => {},
        } as NetworkProxy,
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        // @ts-expect-error
        remoteStates: {
          hasPrimary: sinon.stub().returns(true),
          getPrimary: sinon.stub().returns({
            origin: 'http://foobar.com',
            props: {
              domain: 'foobar',
              tld: 'com',
            },
          }),
        } as RemoteStates,
        testingType: 'e2e',
      }
    })

    function setupCommonRoutes () {
      const router = {
        get: () => {},
        post: () => {},
        all: () => {},
        use: sinon.stub(),
      }

      const Router = sinon.stub().returns(router)

      const { createCommonRoutes } = proxyquire('../../lib/routes', {
        'express': { Router },
      })

      createCommonRoutes(routeOptions)

      return {
        router,
      }
    }

    it('sends 301 if a chrome https upgrade is detected for /', () => {
      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub(),
        redirect: sinon.stub(),
      }
      const next = sinon.stub().throws('next() should not be called')

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(res.status).to.be.calledWith(301)
      expect(res.redirect).to.be.calledWith('http://foobar.com/')
    })

    it('sends 301 if a chrome https upgrade is detected for /__/', () => {
      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'foobar.com',
        path: '/__/',
        proxiedUrl: 'https://foobar.com/__/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub(),
        redirect: sinon.stub(),
      }
      const next = sinon.stub().throws('next() should not be called')

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(res.status).to.be.calledWith(301)
      expect(res.redirect).to.be.calledWith('http://foobar.com/__/')
    })

    it('is a noop if not a matching route', () => {
      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'foobar.com',
        path: '/other-route',
        proxiedUrl: 'https://foobar.com/other-route',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
      }
      const next = sinon.stub()

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if primary remote state has not been established', () => {
      routeOptions.remoteStates.hasPrimary.returns(false)

      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
      }
      const next = sinon.stub()

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if primary hostname and request hostname do not match', () => {
      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'other.com',
        path: '/',
        proxiedUrl: 'https://other.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
      }
      const next = sinon.stub()

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if primary origin is https', () => {
      routeOptions.remoteStates.getPrimary.returns({
        origin: 'https://foobar.com',
        props: {
          domain: 'foobar',
          tld: 'com',
        },
      })

      const { router } = setupCommonRoutes()

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
      }
      const next = sinon.stub()

      res.status.returns(res)

      router.use.withArgs('/').yield(req, res, next)

      expect(next).to.be.called
    })
  })
})
