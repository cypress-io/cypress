import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '@packages/network-tools'
import type { DataContext } from '@packages/data-context'
import type { Cfg } from '../../lib/project-base'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCtx, getCtx, setCtx } from '@packages/data-context'
import { createCommonRoutes } from '../../lib/routes'
import { CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken } from '../../lib/adapters/internal-routes'

const expressStubs = vi.hoisted(() => {
  return {
    Router: vi.fn(),
  }
})

// `createCommonRoutes` builds its router with `Router()`, so the express module
// is the only seam for inspecting what it mounts. Everything else on express
// stays real for the other consumers in the graph.
vi.mock('express', async (importActual) => {
  const actual = await importActual<typeof import('express')>()

  return {
    ...actual,
    Router: expressStubs.Router,
  }
})

// Building the real GraphQL schema loads `graphql` into a second realm, which
// the first realm's types then refuse to mix with. Nothing here calls it.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphQLHTTP: vi.fn(),
  }
})

// `makeDataContext` reaches the same schema. The routes only touch these members.
function makeRoutesContext (): DataContext {
  return {
    coreData: {},
    html: {
      appHtml: async () => '',
    },
    actions: {
      app: {
        setBrowserUserAgent: vi.fn(),
      },
    },
    lifecycleManager: {
      mainProcessWillDisconnect: vi.fn().mockResolvedValue(undefined),
    },
    destroy: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataContext
}

function makeRouter () {
  return {
    get: vi.fn(),
    post: vi.fn(),
    all: vi.fn(),
    use: vi.fn(),
  }
}

describe('lib/routes', () => {
  beforeEach(async () => {
    await clearCtx()
    setCtx(makeRoutesContext())
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await clearCtx()
  })

  // https://github.com/cypress-io/cypress/issues/25891
  describe('https upgrade fix', () => {
    let routeOptions

    beforeEach(() => {
      routeOptions = {
        config: {
          clientRoute: '/__/',
          namespace: 'namespace',
        } as Cfg,
        getSpec: vi.fn().mockReturnValue({}),
        getNetworkProxy: () => {
          return {
            handleHttpRequest: () => {},
          } as unknown as NetworkProxy
        },
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        remoteStates: {
          hasPrimary: vi.fn().mockReturnValue(true),
          getPrimary: vi.fn().mockReturnValue({
            origin: 'http://foobar.com',
            props: {
              domain: 'foobar',
              tld: 'com',
            },
          }),
        } as unknown as RemoteStates,
        isBrowserNetworkMode: () => false,
        testingType: 'e2e',
      }
    })

    function setupCommonRoutes () {
      const router = makeRouter()

      expressStubs.Router.mockReturnValue(router as any)

      createCommonRoutes(routeOptions)

      return {
        router,
      }
    }

    it('sends 301 if a chrome https upgrade is detected for /', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(),
        redirect: vi.fn(),
      }
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      res.status.mockReturnValue(res as any)

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(301)
      expect(res.redirect).toHaveBeenCalledWith('http://foobar.com/')
    })

    it('sends 301 if a chrome https upgrade is detected for /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/__/',
        proxiedUrl: 'https://foobar.com/__/',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(),
        redirect: vi.fn(),
      }
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      res.status.mockReturnValue(res as any)

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(301)
      expect(res.redirect).toHaveBeenCalledWith('http://foobar.com/__/')
    })

    it('is a noop if path is neither / nor /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/something-else',
        proxiedUrl: 'https://foobar.com/something-else',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(() => {
          throw new Error('res.status() should not be called')
        }),
        redirect: vi.fn(),
      }
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('is a noop if protocol is not https', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'http://foobar.com/',
        protocol: 'http',
      }
      const res = {
        status: vi.fn(() => {
          throw new Error('res.status() should not be called')
        }),
        redirect: vi.fn(),
      }
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('is a noop if primary remote state has not been established', () => {
      routeOptions.remoteStates.hasPrimary.mockReturnValue(false)

      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(() => {
          throw new Error('res.status() should not be called')
        }),
        redirect: vi.fn(),
      }
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('is a noop if primary hostname and request hostname do not match', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'other.com',
        path: '/',
        proxiedUrl: 'https://other.com/',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(() => {
          throw new Error('res.status() should not be called')
        }),
        redirect: vi.fn(),
      }
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('is a noop if primary origin is https', () => {
      routeOptions.remoteStates.getPrimary.mockReturnValue({
        origin: 'https://foobar.com',
        props: {
          domain: 'foobar',
          tld: 'com',
        },
      })

      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1]

      const req = {
        hostname: 'foobar.com',
        path: '/',
        proxiedUrl: 'https://foobar.com/',
        protocol: 'https',
      }
      const res = {
        status: vi.fn(() => {
          throw new Error('res.status() should not be called')
        }),
        redirect: vi.fn(),
      }
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
    })

    it('initializes routes on studio if present', () => {
      const studioManager = {
        status: 'INITIALIZED',
        initializeRoutes: vi.fn(),
        isProtocolEnabled: false,
        captureStudioEvent: vi.fn(),
        canAccessStudioAI: vi.fn(),
        setProtocolDb: vi.fn(),
        addSocketListeners: vi.fn(),
      }

      const studioLifecycleManager = {
        registerStudioReadyListener: vi.fn((callback) => {
          callback(studioManager)

          return () => {}
        }),
      }

      getCtx().coreData.studioLifecycleManager = studioLifecycleManager as any

      const { router } = setupCommonRoutes()

      expect(studioManager.initializeRoutes).toHaveBeenCalledWith(router)
    })

    it('initializes routes on cy prompt if present', () => {
      const cyPromptManager = {
        initializeRoutes: vi.fn(),
      }

      const cyPromptLifecycleManager = {
        registerCyPromptReadyListener: vi.fn((callback) => {
          callback(cyPromptManager)

          return () => {}
        }),
      }

      getCtx().coreData.cyPromptLifecycleManager = cyPromptLifecycleManager as any

      const { router } = setupCommonRoutes()

      expect(cyPromptManager.initializeRoutes).toHaveBeenCalledWith(router)
    })
  })

  describe('clientRoute non-proxied guard', () => {
    function getClientRouteHandler (isBrowserNetworkMode: boolean) {
      const router = makeRouter()

      expressStubs.Router.mockReturnValue(router as any)

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
        } as Cfg,
        getSpec: vi.fn().mockReturnValue({}),
        getNetworkProxy: () => {
          return {
            handleHttpRequest: () => {},
          } as unknown as NetworkProxy
        },
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        remoteStates: {
          hasPrimary: vi.fn().mockReturnValue(false),
        } as unknown as RemoteStates,
        isBrowserNetworkMode: () => isBrowserNetworkMode,
        testingType: 'e2e',
      })

      const clientRouteCall = router.get.mock.calls.find((args) => args[0] === '/__/')

      return clientRouteCall?.[1]
    }

    it('serves Whoops for path-only clientRoute when the HTTP proxy is enabled', async () => {
      const handler = getClientRouteHandler(false)
      const appHtml = vi.spyOn(getCtx().html, 'appHtml').mockResolvedValue('<html>whoops</html>')
      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }

      await handler({
        proxiedUrl: '/__/',
        headers: {},
      }, res)

      expect(appHtml).toHaveBeenCalledWith(true, false)
    })

    it('serves the runner app for path-only clientRoute when CDP replaces the HTTP proxy', async () => {
      const handler = getClientRouteHandler(true)
      const appHtml = vi.spyOn(getCtx().html, 'appHtml').mockResolvedValue('<html>runner</html>')
      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }

      await handler({
        proxiedUrl: '/__/',
        headers: {},
      }, res)

      expect(appHtml).toHaveBeenCalledWith(false, true)
    })
  })

  describe('catch-all', () => {
    function setupCatchAll ({ remoteState, isBrowserNetworkMode = () => true, getNetworkProxy }: { remoteState: any, isBrowserNetworkMode?: () => boolean, getNetworkProxy?: () => NetworkProxy }) {
      const router = makeRouter()

      expressStubs.Router.mockReturnValue(router as any)

      const handleHttpRequest = vi.fn().mockResolvedValue(undefined)

      // production always supplies the lazy getter — the CDP Fetch runtime
      // installs a new NetworkProxy at every launch
      getNetworkProxy = getNetworkProxy ?? (() => ({ handleHttpRequest } as unknown as NetworkProxy))

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
          port: 2020,
        } as Cfg,
        getSpec: vi.fn().mockReturnValue({}),
        getNetworkProxy,
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        remoteStates: {
          hasPrimary: vi.fn().mockReturnValue(false),
          current: vi.fn().mockReturnValue(remoteState),
        } as unknown as RemoteStates,
        isBrowserNetworkMode,
        testingType: 'e2e',
      })

      const catchAllCalls = router.all.mock.calls.filter((args) => args[0] === '*')

      expect(catchAllCalls, 'exactly one catch-all is mounted so the network path decides at request time').toHaveLength(1)

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
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      await handler(req, res, next)

      expect(handleHttpRequest).toHaveBeenCalledWith(req, res)
    })

    it('follows the network path in effect when it flips on the same router', async () => {
      let isCdp = false
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => isCdp,
      })
      const mitmReq = { url: 'http://example.com/anything', method: 'GET', headers: {} }
      const mitmRes = {}

      await handler(mitmReq, mitmRes, vi.fn(() => {
        throw new Error('next() should not be called')
      }))

      expect(handleHttpRequest).toHaveBeenCalledWith(mitmReq, mitmRes)

      isCdp = true
      const cdpReq = { url: '/anything', method: 'GET', headers: {} }
      const next = vi.fn()

      await handler(cdpReq, {}, next)

      expect(next).toHaveBeenCalled()
      expect(handleHttpRequest).not.toHaveBeenCalledWith(cdpReq, expect.anything())
    })

    it('serves strategy:file requests through the interception pipeline', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({ remoteState: fileRemoteState })
      const req = { url: '/cypress/fixtures/dom.html', method: 'GET', headers: {} }
      const res = {}
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      await handler(req, res, next)

      expect(handleHttpRequest).toHaveBeenCalledWith(req, res)
      // the pipeline routes by proxiedUrl — it must be absolute at our origin
      expect((req as any).proxiedUrl).toEqual('http://localhost:2020/cypress/fixtures/dom.html')
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
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      await handler(req, res, next)

      expect(handleHttpRequest).toHaveBeenCalledWith(req, res)
      expect((req as any).proxiedUrl).toEqual('http://127.0.0.1:2020/cypress/fixtures/dom.html')
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
      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      await handler(req, res, next)

      expect(handleHttpRequest).toHaveBeenCalledWith(req, res)
      // net-stubbing and the file-server rewrite must see the real target,
      // not this server's origin
      expect(req.proxiedUrl).toEqual('http://www.foobar.com:9500/test.html')
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
      const next = vi.fn()

      await handler(req, {}, next)

      expect(next).toHaveBeenCalled()
      expect(handleHttpRequest).not.toHaveBeenCalled()
    })

    // the CDP Fetch runtime replaces NetworkProxy at every launch, so a captured
    // instance would keep serving requests through a disposed pipeline
    it('resolves the NetworkProxy per request, so a launch swap is observed', async () => {
      const first = { handleHttpRequest: vi.fn().mockResolvedValue(undefined) }
      const second = { handleHttpRequest: vi.fn().mockResolvedValue(undefined) }
      let current = first

      const { handler } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => false,
        getNetworkProxy: () => current as unknown as NetworkProxy,
      })

      const firstReq = { url: 'http://example.com/one', method: 'GET', headers: {} }
      const firstRes = {}

      await handler(firstReq, firstRes, vi.fn(() => {
        throw new Error('next() should not be called')
      }))

      expect(first.handleHttpRequest).toHaveBeenCalledWith(firstReq, firstRes)

      current = second
      const secondReq = { url: 'http://example.com/two', method: 'GET', headers: {} }
      const secondRes = {}

      await handler(secondReq, secondRes, vi.fn(() => {
        throw new Error('next() should not be called')
      }))

      expect(second.handleHttpRequest).toHaveBeenCalledWith(secondReq, secondRes)
      expect(first.handleHttpRequest).toHaveBeenCalledTimes(1)
    })

    it('falls through for URLs the file server cannot resolve', async () => {
      const { handler, handleHttpRequest } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
      })
      const req = { url: '/anything', method: 'GET', headers: {} }
      const next = vi.fn()

      await handler(req, {}, next)

      expect(next).toHaveBeenCalled()
      expect(handleHttpRequest).not.toHaveBeenCalled()
    })
  })
})
