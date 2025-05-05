import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '../../lib/remote_states'

import chai, { expect } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Cfg } from '../../lib/project-base'
import '../spec_helper'
import { getCtx } from '@packages/data-context'

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
        get: sinon.stub(),
        post: sinon.stub(),
        all: sinon.stub(),
        use: sinon.spy(),
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

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

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

      middleware(req, res, next)

      expect(res.status).to.be.calledWith(301)
      expect(res.redirect).to.be.calledWith('http://foobar.com/')
    })

    it('sends 301 if a chrome https upgrade is detected for /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

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

      middleware(req, res, next)

      expect(res.status).to.be.calledWith(301)
      expect(res.redirect).to.be.calledWith('http://foobar.com/__/')
    })

    it('is a noop if path is neither / nor /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/something-else',
        proxiedUrl: 'https://foobar.com/something-else',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
        redirect: sinon.stub(),
      }
      const next = sinon.stub()

      middleware(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if protocol is not https', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'http://foobar.com/',
        protocol: 'http',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
        redirect: sinon.stub(),
      }
      const next = sinon.stub()

      middleware(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if primary remote state has not been established', () => {
      routeOptions.remoteStates.hasPrimary.returns(false)

      const { router } = setupCommonRoutes()

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
        redirect: sinon.stub(),
      }
      const next = sinon.stub()

      middleware(req, res, next)

      expect(next).to.be.called
    })

    it('is a noop if primary hostname and request hostname do not match', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'other.com',
        path: '/',
        proxiedUrl: 'https://other.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
        redirect: sinon.stub(),
      }
      const next = sinon.stub()

      middleware(req, res, next)

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

      const middleware = router.use.args.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: sinon.stub().throws('res.status() should not be called'),
        redirect: sinon.stub(),
      }
      const next = sinon.stub()

      middleware(req, res, next)

      expect(next).to.be.called
    })

    it('initializes routes on studio if present', () => {
      const studioManager = {
        status: 'INITIALIZED',
        initializeRoutes: sinon.stub(),
        isProtocolEnabled: false,
        captureStudioEvent: sinon.stub(),
        canAccessStudioAI: sinon.stub(),
        setProtocolDb: sinon.stub(),
        addSocketListeners: sinon.stub(),
      }

      const studioLifecycleManager = {
        registerStudioReadyListener: sinon.stub().callsFake((callback) => {
          callback(studioManager)

          return () => {}
        }),
      }

      getCtx().coreData.studioLifecycleManager = studioLifecycleManager as any

      const { router } = setupCommonRoutes()

      expect(studioManager.initializeRoutes).to.be.calledWith(router)
    })

    it('initializes a dummy route for studio if studio is not present', () => {
      delete getCtx().coreData.studioLifecycleManager

      const studioRouter = {
        get: sinon.stub(),
        post: sinon.stub(),
        all: sinon.stub(),
        use: sinon.stub(),
      }

      const router = {
        get: sinon.stub(),
        post: sinon.stub(),
        all: sinon.stub(),
        use: sinon.stub().withArgs('/').returns(studioRouter),
      }

      const Router = sinon.stub()

      Router.onFirstCall().returns(router)
      Router.onSecondCall().returns(studioRouter)

      const { createCommonRoutes } = proxyquire('../../lib/routes', {
        'express': { Router },
      })

      createCommonRoutes(routeOptions)

      expect(router.use).to.have.been.calledWith('/')

      expect(Router).to.have.been.calledTwice

      expect(getCtx().coreData.studioLifecycleManager).to.be.undefined
    })

    it('does not initialize routes on studio if status is in error', () => {
      const studioManager = {
        status: 'IN_ERROR',
        initializeRoutes: sinon.stub(),
      }

      const studioLifecycleManager = {
        registerStudioReadyListener: sinon.stub().returns(() => {}),
      }

      getCtx().coreData.studioLifecycleManager = studioLifecycleManager as any

      setupCommonRoutes()

      expect(studioManager.initializeRoutes).not.to.be.called
    })
  })
})
