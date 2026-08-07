import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '@packages/network-tools'

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

    it('initializes routes on cy prompt if present', () => {
      const cyPromptManager = {
        initializeRoutes: sinon.stub(),
      }

      const cyPromptLifecycleManager = {
        registerCyPromptReadyListener: sinon.stub().callsFake((callback) => {
          callback(cyPromptManager)

          return () => {}
        }),
      }

      getCtx().coreData.cyPromptLifecycleManager = cyPromptLifecycleManager as any

      const { router } = setupCommonRoutes()

      expect(cyPromptManager.initializeRoutes).to.be.calledWith(router)
    })
  })

  describe('clientRoute non-proxied guard', () => {
    afterEach(() => {
      delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
      sinon.restore()
    })

    function getClientRouteHandler (configOverrides: Partial<Cfg> = {}) {
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

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
          ...configOverrides,
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
          hasPrimary: sinon.stub().returns(false),
        } as RemoteStates,
        testingType: 'e2e',
      })

      const clientRouteCall = router.get.args.find((args) => args[0] === '/__/')

      return clientRouteCall?.[1]
    }

    it('serves Whoops for path-only clientRoute when the HTTP proxy is enabled', async () => {
      const handler = getClientRouteHandler()
      const appHtml = sinon.stub(getCtx().html, 'appHtml').resolves('<html>whoops</html>')
      const res = {
        setHeader: sinon.stub(),
        send: sinon.stub(),
        status: sinon.stub().returnsThis(),
      }

      await handler({
        proxiedUrl: '/__/',
        headers: {},
      }, res)

      expect(appHtml).to.have.been.calledWith(true)
    })

    it('serves the runner app for path-only clientRoute when CDP replaces the HTTP proxy', async () => {
      process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'

      const handler = getClientRouteHandler()
      const appHtml = sinon.stub(getCtx().html, 'appHtml').resolves('<html>runner</html>')
      const res = {
        setHeader: sinon.stub(),
        send: sinon.stub(),
        status: sinon.stub().returnsThis(),
      }

      await handler({
        proxiedUrl: '/__/',
        headers: {},
      }, res)

      expect(appHtml).to.have.been.calledWith(false)
    })
  })

  describe('direct-origin catch-all (proxy disabled)', () => {
    afterEach(() => {
      delete process.env.CYPRESS_INTERNAL_DISABLE_PROXY
    })

    function setupCatchAll ({ remoteState }) {
      process.env.CYPRESS_INTERNAL_DISABLE_PROXY = '1'

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
      const handleHttpRequest = sinon.stub().resolves()

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
          port: 2020,
        } as Cfg,
        getSpec: sinon.stub().returns({}),
        // @ts-expect-error
        networkProxy: {
          handleHttpRequest,
        } as NetworkProxy,
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        // @ts-expect-error
        remoteStates: {
          hasPrimary: sinon.stub().returns(false),
          current: sinon.stub().returns(remoteState),
        } as RemoteStates,
        testingType: 'e2e',
      })

      const catchAllCall = router.all.args.find((args) => args[0] === '*')

      return { handler: catchAllCall?.[1], handleHttpRequest }
    }

    const fileRemoteState = {
      strategy: 'file',
      origin: 'http://localhost:2020',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    }

    it('serves strategy:file requests through the interception pipeline', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({ remoteState: fileRemoteState })
      const req = { url: '/cypress/fixtures/dom.html', headers: {} }
      const res = {}
      const next = sinon.stub().throws('next() should not be called')

      await handler(req, res, next)

      expect(handleHttpRequest).to.have.been.calledWith(req, res)
      // the pipeline routes by proxiedUrl — it must be absolute at our origin
      expect((req as any).proxiedUrl).to.eq('http://localhost:2020/cypress/fixtures/dom.html')
    })

    it('falls through for URLs the file server cannot resolve', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
      })
      const req = { url: '/anything', headers: {} }
      const next = sinon.stub()

      await handler(req, {}, next)

      expect(next).to.have.been.called
      expect(handleHttpRequest).to.not.have.been.called
    })
  })
})
