import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '@packages/network-tools'

import chai, { expect } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'
import { Cfg } from '../../lib/project-base'
import '../spec_helper'
import { getCtx } from '@packages/data-context'
import { CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken } from '../../lib/adapters/internal-routes'

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
        getNetworkProxy: () => ({
          handleHttpRequest: () => {},
        } as unknown as NetworkProxy),
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
        isBrowserNetworkMode: () => false,
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
      sinon.restore()
    })

    function getClientRouteHandler (isBrowserNetworkMode: boolean) {
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
        } as Cfg,
        getSpec: sinon.stub().returns({}),
        getNetworkProxy: () => ({
          handleHttpRequest: () => {},
        } as unknown as NetworkProxy),
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        // @ts-expect-error
        remoteStates: {
          hasPrimary: sinon.stub().returns(false),
        } as RemoteStates,
        isBrowserNetworkMode: () => isBrowserNetworkMode,
        testingType: 'e2e',
      })

      const clientRouteCall = router.get.args.find((args) => args[0] === '/__/')

      return clientRouteCall?.[1]
    }

    it('serves Whoops for path-only clientRoute when the HTTP proxy is enabled', async () => {
      const handler = getClientRouteHandler(false)
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

      expect(appHtml).to.have.been.calledWith(true, false)
    })

    it('serves the runner app for path-only clientRoute when CDP replaces the HTTP proxy', async () => {
      const handler = getClientRouteHandler(true)
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

      expect(appHtml).to.have.been.calledWith(false, true)
    })
  })

  describe('catch-all', () => {
    function setupCatchAll ({ remoteState, isBrowserNetworkMode = () => true, getNetworkProxy }: { remoteState: any, isBrowserNetworkMode?: () => boolean, getNetworkProxy?: () => NetworkProxy }) {
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

      // production always supplies the lazy getter — the CDP Fetch runtime
      // installs a new NetworkProxy at every launch
      getNetworkProxy = getNetworkProxy ?? (() => ({ handleHttpRequest } as unknown as NetworkProxy))

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
          port: 2020,
        } as Cfg,
        getSpec: sinon.stub().returns({}),
        getNetworkProxy,
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        // @ts-expect-error
        remoteStates: {
          hasPrimary: sinon.stub().returns(false),
          current: sinon.stub().returns(remoteState),
        } as RemoteStates,
        isBrowserNetworkMode,
        testingType: 'e2e',
      })

      const catchAllCalls = router.all.args.filter((args) => args[0] === '*')

      expect(catchAllCalls, 'exactly one catch-all is mounted so the network path decides at request time').to.have.length(1)

      return { handler: catchAllCalls[0]?.[1], handleHttpRequest }
    }

    const fileRemoteState = {
      strategy: 'file',
      origin: 'http://localhost:2020',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    }

    it('hands every request to the pipeline on the MITM path', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => false,
      })
      const req = { url: 'http://example.com/anything', method: 'GET', headers: {} }
      const res = {}
      const next = sinon.stub().throws('next() should not be called')

      await handler(req, res, next)

      expect(handleHttpRequest).to.have.been.calledWith(req, res)
    })

    it('follows the network path in effect when it flips on the same router', async () => {
      let isCdp = false
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => isCdp,
      })
      const mitmReq = { url: 'http://example.com/anything', method: 'GET', headers: {} }

      await handler(mitmReq, {}, sinon.stub().throws('next() should not be called'))

      expect(handleHttpRequest).to.have.been.calledWith(mitmReq)

      isCdp = true
      const cdpReq = { url: '/anything', method: 'GET', headers: {} }
      const next = sinon.stub()

      await handler(cdpReq, {}, next)

      expect(next).to.have.been.called
      expect(handleHttpRequest).to.not.have.been.calledWith(cdpReq)
    })

    it('serves strategy:file requests through the interception pipeline', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({ remoteState: fileRemoteState })
      const req = { url: '/cypress/fixtures/dom.html', method: 'GET', headers: {} }
      const res = {}
      const next = sinon.stub().throws('next() should not be called')

      await handler(req, res, next)

      expect(handleHttpRequest).to.have.been.calledWith(req, res)
      // the pipeline routes by proxiedUrl — it must be absolute at our origin
      expect((req as any).proxiedUrl).to.eq('http://localhost:2020/cypress/fixtures/dom.html')
    })

    it('serves strategy:file requests addressed under an aliased host name', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: {
          strategy: 'file',
          origin: 'http://127.0.0.1:2020',
          fileServer: 'http://localhost:2021',
          domainName: 'localhost',
          props: null,
        },
      })
      // The Host header names us differently than the configured base —
      // the toFileServerUrl origin comparison is the authorization gate.
      const req = { url: '/cypress/fixtures/dom.html', method: 'GET', protocol: 'http', headers: { host: '127.0.0.1:2020' } }
      const res = {}
      const next = sinon.stub().throws('next() should not be called')

      await handler(req, res, next)

      expect(handleHttpRequest).to.have.been.calledWith(req, res)
      expect((req as any).proxiedUrl).to.eq('http://127.0.0.1:2020/cypress/fixtures/dom.html')
    })

    it('serves loopback-token requests without rewriting the URL', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({ remoteState: fileRemoteState })
      // the pre-flight and the CDP origin redirect both arrive with proxiedUrl
      // already restored to the URL that was actually asked for
      const req = {
        url: '/test.html',
        method: 'GET',
        proxiedUrl: 'http://www.foobar.com:9500/test.html',
        headers: { [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken },
      }
      const res = {}
      const next = sinon.stub().throws('next() should not be called')

      await handler(req, res, next)

      expect(handleHttpRequest).to.have.been.calledWith(req, res)
      // net-stubbing and the file-server rewrite must see the real target,
      // not this server's origin
      expect(req.proxiedUrl).to.eq('http://www.foobar.com:9500/test.html')
    })

    it('ignores a forged loopback header without the token', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
      })
      const req = {
        url: '/test.html',
        method: 'GET',
        proxiedUrl: 'http://www.foobar.com:9500/test.html',
        headers: { 'x-cypress-internal-loopback': 'http://www.foobar.com:9500/test.html' },
      }
      const next = sinon.stub()

      await handler(req, {}, next)

      expect(next).to.have.been.called
      expect(handleHttpRequest).to.not.have.been.called
    })

    // the CDP Fetch runtime replaces NetworkProxy at every launch, so a captured
    // instance would keep serving requests through a disposed pipeline
    it('resolves the NetworkProxy per request, so a launch swap is observed', async () => {
      const first = { handleHttpRequest: sinon.stub().resolves() }
      const second = { handleHttpRequest: sinon.stub().resolves() }
      let current = first

      const { handler } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => false,
        getNetworkProxy: () => current as unknown as NetworkProxy,
      })

      const firstReq = { url: 'http://example.com/one', method: 'GET', headers: {} }

      await handler(firstReq, {}, sinon.stub().throws('next() should not be called'))

      expect(first.handleHttpRequest).to.have.been.calledWith(firstReq)

      current = second
      const secondReq = { url: 'http://example.com/two', method: 'GET', headers: {} }

      await handler(secondReq, {}, sinon.stub().throws('next() should not be called'))

      expect(second.handleHttpRequest).to.have.been.calledWith(secondReq)
      expect(first.handleHttpRequest).to.have.been.calledOnce
    })

    it('falls through for URLs the file server cannot resolve', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
      })
      const req = { url: '/anything', method: 'GET', headers: {} }
      const next = sinon.stub()

      await handler(req, {}, next)

      expect(next).to.have.been.called
      expect(handleHttpRequest).to.not.have.been.called
    })
  })
})
