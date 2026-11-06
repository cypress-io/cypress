import type { NetworkProxy } from '@packages/proxy'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '@packages/network-tools'
import type { DataContext } from '@packages/data-context'
import type { Cfg } from '../../lib/project-base'
import type { SocketAllowed } from '../../lib/util/socket_allowed'
import path from 'path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearCtx, getCtx, setCtx } from '@packages/data-context'
import { createCommonRoutes } from '../../lib/routes'
import { CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken } from '../../lib/adapters/internal-routes'
import { tapGraphQLHTTP } from '@packages/data-context/graphql/makeGraphQLServer'
import { cypressSessions } from '../../lib/cypress-sessions'
import { privilegedCommandsManager } from '../../lib/privileged-commands/privileged-commands-manager'
import * as plugins from '../../lib/plugins'
import { render } from '../../lib/template_engine'

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
    tapGraphQLHTTP: vi.fn(),
  }
})

vi.mock('../../lib/plugins', async (importActual) => {
  return {
    ...(await importActual<typeof import('../../lib/plugins')>()),
    execute: vi.fn(),
  }
})

const listenPort = 2020

// Trusts this server's own origin only; tests widen it per case.
function makeSocketAllowed (): SocketAllowed {
  const isTrustedOrigin = vi.fn((origin: string) => origin === `http://localhost:${listenPort}`)

  return {
    isTrustedOrigin,
    isRequestFromTrustedOrigin: vi.fn((req) => typeof req.headers.origin === 'string' && isTrustedOrigin(req.headers.origin)),
  } as unknown as SocketAllowed
}

// Express always attaches the socket the request arrived on.
function makeRequest (req: Record<string, any>) {
  return { headers: {}, socket: { localPort: listenPort }, ...req }
}

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
        socketAllowed: makeSocketAllowed(),
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

    describe('graphql mounts', () => {
      const graphqlMount = (router: ReturnType<typeof makeRouter>, path: string) => {
        return router.use.mock.calls.find((args) => args[0] === path)
      }

      it('does not mount a graphql handler under the namespace', () => {
        const { router } = setupCommonRoutes()

        expect(router.use.mock.calls.filter((args) => typeof args[0] === 'string' && args[0].startsWith('/namespace/graphql'))).toEqual([])
      })

      it('mounts the tap graphql handler on the tap mount in open mode', () => {
        const { router } = setupCommonRoutes()

        expect(graphqlMount(router, '/__cypress/tap/graphql/*')).toEqual(['/__cypress/tap/graphql/*', expect.any(Function), tapGraphQLHTTP])
      })

      describe('tap mount session guard', () => {
        const guard = (headers: Record<string, string | string[]>) => {
          const { router } = setupCommonRoutes()
          const middleware = graphqlMount(router, '/__cypress/tap/graphql/*')?.[1]
          const res = { sendStatus: vi.fn() }
          const next = vi.fn()

          middleware({ headers }, res, next)

          return { res, next }
        }

        beforeEach(() => {
          vi.spyOn(cypressSessions, 'getCurrent').mockReturnValue({ sessionId: 'abc' } as any)
        })

        it('passes a request carrying the current session id', () => {
          const { res, next } = guard({ 'x-cypress-session-id': 'abc' })

          expect(next).toHaveBeenCalled()
          expect(res.sendStatus).not.toHaveBeenCalled()
        })

        it('answers 404 without the session id header', () => {
          const { res, next } = guard({})

          expect(res.sendStatus).toHaveBeenCalledWith(404)
          expect(next).not.toHaveBeenCalled()
        })

        it('answers 404 for a repeated session id header', () => {
          const { res, next } = guard({ 'x-cypress-session-id': ['abc', 'abc'] })

          expect(res.sendStatus).toHaveBeenCalledWith(404)
          expect(next).not.toHaveBeenCalled()
        })

        it('answers 404 for a session id that is not current', () => {
          const { res, next } = guard({ 'x-cypress-session-id': 'nope' })

          expect(res.sendStatus).toHaveBeenCalledWith(404)
          expect(next).not.toHaveBeenCalled()
        })
      })
    })
  })

  describe('clientRoute guard', () => {
    function getClientRouteHandler (isBrowserNetworkMode: boolean, { primaryOrigin }: { primaryOrigin?: string } = {}) {
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
          hasPrimary: vi.fn().mockReturnValue(!!primaryOrigin),
          isPrimarySuperDomainOrigin: vi.fn((url: string) => !!primaryOrigin && new URL(url).origin === primaryOrigin),
        } as unknown as RemoteStates,
        socketAllowed: makeSocketAllowed(),
        isBrowserNetworkMode: () => isBrowserNetworkMode,
        testingType: 'e2e',
      })

      const clientRouteCall = router.get.mock.calls.find((args) => args[0] === '/__/')

      return clientRouteCall?.[1]
    }

    // appHtml serves the runner for `false` and the "not launched through
    // Cypress" page for `true`
    async function serve (handler, req: Record<string, any>) {
      const appHtml = vi.spyOn(getCtx().html, 'appHtml').mockResolvedValue('<html></html>')
      const res = {
        setHeader: vi.fn(),
        send: vi.fn(),
        status: vi.fn().mockReturnThis(),
      }

      await handler(makeRequest(req), res)

      return appHtml.mock.calls[0]
    }

    describe('under the HTTP proxy', () => {
      it('serves Whoops for a path-only request', async () => {
        expect(await serve(getClientRouteHandler(false), { proxiedUrl: '/__/', headers: { host: 'localhost:2020' } })).toEqual([true, false])
      })

      it('serves the runner app for a request proxied to this server by a loopback name on its port', async () => {
        expect(await serve(getClientRouteHandler(false), { proxiedUrl: 'http://localhost:2020/__/', headers: { host: 'localhost:2020' } })).toEqual([false, false])
      })

      it('serves the runner app for a request proxied to the primary origin', async () => {
        const handler = getClientRouteHandler(false, { primaryOrigin: 'http://www.foobar.com' })

        expect(await serve(handler, { proxiedUrl: 'http://www.foobar.com/__/', headers: { host: 'www.foobar.com' } })).toEqual([false, false])
      })

      it('serves Whoops for a request proxied to another origin', async () => {
        const handler = getClientRouteHandler(false, { primaryOrigin: 'http://www.foobar.com' })

        expect(await serve(handler, { proxiedUrl: 'http://other.example.com/__/', headers: { host: 'other.example.com' } })).toEqual([true, false])
      })

      it('serves Whoops for a request whose absolute URL does not parse', async () => {
        expect(await serve(getClientRouteHandler(false), { proxiedUrl: 'http://localhost:99999/__/', headers: { host: 'localhost:99999' } })).toEqual([true, false])
      })
    })

    describe('on the browser (CDP) network path', () => {
      it('serves the runner app for a path-only request addressed by a loopback name on its port', async () => {
        expect(await serve(getClientRouteHandler(true), { proxiedUrl: '/__/', headers: { host: 'localhost:2020' } })).toEqual([false, true])
      })

      it('serves Whoops for a path-only request under another host', async () => {
        expect(await serve(getClientRouteHandler(true), { proxiedUrl: '/__/', headers: { host: 'other.example.com:2020' } })).toEqual([true, true])
      })

      it('serves the runner app for a looped-back request to the primary origin', async () => {
        const handler = getClientRouteHandler(true, { primaryOrigin: 'http://www.foobar.com' })

        expect(await serve(handler, { proxiedUrl: 'http://www.foobar.com/__/', headers: { host: 'localhost:2020' } })).toEqual([false, true])
      })

      it('serves Whoops for a looped-back request to another origin', async () => {
        const handler = getClientRouteHandler(true, { primaryOrigin: 'http://www.foobar.com' })

        expect(await serve(handler, { proxiedUrl: 'http://other.example.com/__/', headers: { host: 'localhost:2020' } })).toEqual([true, true])
      })
    })
  })

  describe('catch-all', () => {
    function setupCatchAll ({ remoteState, isBrowserNetworkMode = () => true, getNetworkProxy }: { remoteState: any, isBrowserNetworkMode?: () => boolean, getNetworkProxy?: () => NetworkProxy | undefined }) {
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
        socketAllowed: makeSocketAllowed(),
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
      expect((req as any).proxiedUrl).toStrictEqual('http://localhost:2020/cypress/fixtures/dom.html')
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
      expect((req as any).proxiedUrl).toStrictEqual('http://127.0.0.1:2020/cypress/fixtures/dom.html')
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
      expect(req.proxiedUrl).toStrictEqual('http://www.foobar.com:9500/test.html')
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

    // close() disposes the NetworkProxy before the HTTP server stops accepting
    // connections, and a rejection here would exit the process
    it('drops a request that arrives after the NetworkProxy is disposed', async () => {
      const { handler } = setupCatchAll({
        remoteState: { strategy: 'http', origin: 'http://localhost:3500', props: null },
        isBrowserNetworkMode: () => false,
        getNetworkProxy: () => undefined,
      })
      const req = { url: 'http://example.com/late', method: 'GET', headers: {} }
      const res = { destroy: vi.fn() }

      await expect(handler(req, res, vi.fn())).resolves.toBeUndefined()

      expect(res.destroy).toHaveBeenCalled()
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

  describe('runner-only routes', () => {
    const specBridgeOrigin = 'http://www.foobar.com:3500'

    function setupRoutes ({ chromeWebSecurity = true, renderedHTMLOrigins }: { chromeWebSecurity?: boolean, renderedHTMLOrigins?: Record<string, boolean> } = {}) {
      const router = makeRouter()

      expressStubs.Router.mockReturnValue(router as any)

      const socketAllowed = makeSocketAllowed()

      createCommonRoutes({
        config: {
          clientRoute: '/__/',
          namespace: '__cypress',
          projectRoot: '/project',
          chromeWebSecurity,
        } as Cfg,
        getSpec: vi.fn().mockReturnValue({}),
        getNetworkProxy: () => {
          return {
            handleHttpRequest: () => {},
            http: { getRenderedHTMLOrigins: () => renderedHTMLOrigins },
          } as unknown as NetworkProxy
        },
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        remoteStates: {
          hasPrimary: vi.fn().mockReturnValue(false),
        } as unknown as RemoteStates,
        socketAllowed,
        isBrowserNetworkMode: () => false,
        testingType: 'e2e',
      })

      const handler = (method: 'get' | 'post', route: string) => {
        const args = router[method].mock.calls.find((call) => call[0] === route)

        return args?.[args.length - 1]
      }

      return { handler, socketAllowed }
    }

    const makeRes = () => ({ sendStatus: vi.fn(), json: vi.fn(), render: vi.fn() })

    beforeEach(() => {
      privilegedCommandsManager.reset()
      vi.mocked(plugins.execute).mockReset().mockResolvedValue('bundled')
    })

    describe('POST process-origin-callback', () => {
      const body = { file: '/project/cypress/support/e2e.ts', fn: 'fn', projectRoot: '/elsewhere' }

      it('answers 403 for a request from another origin', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: 'https://other.example.com' } }), res)

        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(plugins.execute).not.toHaveBeenCalled()
      })

      it('answers 403 for a request without an Origin header', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body }), res)

        expect(res.sendStatus).toHaveBeenCalledWith(403)
      })

      it('processes the callback from a trusted origin, with the project root from the config', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: 'http://localhost:2020' } }), res)

        expect(plugins.execute).toHaveBeenCalledWith('_process:cross:origin:callback', { file: body.file, fn: body.fn, projectRoot: '/project' })
        expect(res.json).toHaveBeenCalledWith({ contents: 'bundled' })
      })

      // the loopback forwards the browser's Origin header alongside the token
      it('processes the callback looped back from a trusted origin', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: 'http://localhost:2020', [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken } }), res)

        expect(res.json).toHaveBeenCalledWith({ contents: 'bundled' })
      })

      it('answers 403 for a request looped back from another origin', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: 'https://other.example.com', [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken } }), res)

        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(plugins.execute).not.toHaveBeenCalled()
      })

      it('processes the callback from a spec bridge origin the spec opened', async () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        privilegedCommandsManager.specBridgeOrigins.add(specBridgeOrigin)

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: specBridgeOrigin } }), res)

        expect(res.json).toHaveBeenCalledWith({ contents: 'bundled' })
      })

      it('processes the callback without an Origin header when chromeWebSecurity is off', async () => {
        const { handler } = setupRoutes({ chromeWebSecurity: false })
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body }), res)

        expect(res.json).toHaveBeenCalledWith({ contents: 'bundled' })
      })

      // the body only reaches the runner's own test, so the resolver trace stays
      it('reports the stack when processing fails', async () => {
        const err = new Error('Module not found')

        err.stack = 'Error: Module not found\n    at webpack (/packages/server/lib/plugins/child/cross_origin.ts:1:1)'
        vi.mocked(plugins.execute).mockRejectedValue(err)

        const { handler } = setupRoutes()
        const res = makeRes()

        await handler('post', '/__cypress/process-origin-callback')(makeRequest({ body, headers: { origin: 'http://localhost:2020' } }), res)

        expect(res.json.mock.calls[0][0].error).toBe(`Processing the origin callback errored:\n\n${err.stack}`)
      })
    })

    describe('POST add-verified-command', () => {
      const body = { hash: 'hash', name: 'readFile', key: 'key', url: 'http://localhost:2020/__cypress/iframes/spec.cy.js' }

      it('answers 403 for a request from another origin', () => {
        const addVerifiedCommand = vi.spyOn(privilegedCommandsManager, 'addVerifiedCommand')
        const { handler } = setupRoutes()
        const res = makeRes()

        handler('post', '/__cypress/add-verified-command')(makeRequest({ body, headers: { origin: 'https://other.example.com' } }), res)

        expect(res.sendStatus).toHaveBeenCalledWith(403)
        expect(addVerifiedCommand).not.toHaveBeenCalled()
      })

      it('records the command from a trusted origin', () => {
        const addVerifiedCommand = vi.spyOn(privilegedCommandsManager, 'addVerifiedCommand')
        const { handler } = setupRoutes()
        const res = makeRes()

        handler('post', '/__cypress/add-verified-command')(makeRequest({ body, headers: { origin: 'http://localhost:2020' } }), res)

        expect(addVerifiedCommand).toHaveBeenCalledWith(body, 'http://localhost:2020', false)
        expect(res.sendStatus).toHaveBeenCalledWith(204)
      })

      it('records the command from a spec bridge origin the spec opened', () => {
        const addVerifiedCommand = vi.spyOn(privilegedCommandsManager, 'addVerifiedCommand')
        const { handler } = setupRoutes()
        const res = makeRes()

        privilegedCommandsManager.specBridgeOrigins.add(specBridgeOrigin)

        handler('post', '/__cypress/add-verified-command')(makeRequest({ body, headers: { origin: specBridgeOrigin } }), res)

        expect(addVerifiedCommand).toHaveBeenCalledWith(body, specBridgeOrigin, false)
        expect(res.sendStatus).toHaveBeenCalledWith(204)
      })
    })

    describe('storage pages', () => {
      const runnerReferer = 'http://localhost:2020/__cypress/iframes/cypress/e2e/spec.cy.js'
      const htmlDir = path.join(__dirname, '../../lib/html')

      it('renders the get page for the embedding runner document', () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        handler('get', '/__cypress/automation/getLocalStorage')(makeRequest({ headers: { referer: runnerReferer } }), res)

        expect(res.render).toHaveBeenCalledWith(path.join(htmlDir, 'get-local-storage.html'), { parentOrigin: '"http://localhost:2020"' })
      })

      it('renders the get page for an embedding spec bridge document', () => {
        const { handler } = setupRoutes()
        const res = makeRes()

        privilegedCommandsManager.specBridgeOrigins.add(specBridgeOrigin)

        handler('get', '/__cypress/automation/getLocalStorage')(makeRequest({ headers: { referer: `${specBridgeOrigin}/__cypress/spec-bridge-iframes` } }), res)

        expect(res.render).toHaveBeenCalledWith(expect.any(String), { parentOrigin: `"${specBridgeOrigin}"` })
      })

      it('renders the get page without a parent origin for another embedding document, or none', () => {
        for (const headers of [{ referer: 'http://other.example.com/' }, { referer: 'not a url' }, {}]) {
          const { handler } = setupRoutes()
          const res = makeRes()

          handler('get', '/__cypress/automation/getLocalStorage')(makeRequest({ headers }), res)

          expect(res.render, JSON.stringify(headers)).toHaveBeenCalledWith(expect.any(String), { parentOrigin: 'null' })
        }
      })

      it('renders the set page and records the origin for the embedding runner document', () => {
        const renderedHTMLOrigins = {}
        const { handler } = setupRoutes({ renderedHTMLOrigins })
        const res = makeRes()

        handler('get', '/__cypress/automation/setLocalStorage')(makeRequest({
          originalUrl: '/__cypress/automation/setLocalStorage?http://www.foobar.com:3500',
          headers: { referer: runnerReferer },
        }), res)

        expect(res.render).toHaveBeenCalledWith(path.join(htmlDir, 'set-local-storage.html'), { parentOrigin: '"http://localhost:2020"' })
        expect(renderedHTMLOrigins).toEqual({ 'http://www.foobar.com:3500': true })
      })

      it('does not record the origin for another embedding document', () => {
        const renderedHTMLOrigins = {}
        const { handler } = setupRoutes({ renderedHTMLOrigins })
        const res = makeRes()

        handler('get', '/__cypress/automation/setLocalStorage')(makeRequest({
          originalUrl: '/__cypress/automation/setLocalStorage?http://www.foobar.com:3500',
          headers: { referer: 'http://other.example.com/' },
        }), res)

        expect(res.render).toHaveBeenCalledWith(expect.any(String), { parentOrigin: 'null' })
        expect(renderedHTMLOrigins).toEqual({})
      })

      it('renders the parent origin into both templates', async () => {
        for (const file of ['get-local-storage.html', 'set-local-storage.html']) {
          const html = await new Promise<string | undefined>((resolve, reject) => {
            render(path.join(htmlDir, file), { parentOrigin: '"http://localhost:2020"' }, (err, rendered) => err ? reject(err) : resolve(rendered))
          })

          expect(html, file).toContain('const parentOrigin = "http://localhost:2020"')
          expect(html, file).not.toContain('{{')
          expect(html, file).not.toContain('\'*\'')
        }
      })
    })

    describe('error handling middleware', () => {
      const handleError = () => {
        const router = makeRouter()

        expressStubs.Router.mockReturnValue(router as any)

        createCommonRoutes({
          config: { clientRoute: '/__/', namespace: '__cypress' } as Cfg,
          getSpec: vi.fn().mockReturnValue({}),
          getNetworkProxy: () => undefined,
          nodeProxy: {} as HttpProxy,
          onError: () => {},
          remoteStates: { hasPrimary: vi.fn().mockReturnValue(false) } as unknown as RemoteStates,
          socketAllowed: makeSocketAllowed(),
          isBrowserNetworkMode: () => false,
          testingType: 'e2e',
        })

        // Express recognizes error middleware by its arity
        const middleware = router.use.mock.calls.map((args) => args[args.length - 1]).find((fn) => typeof fn === 'function' && fn.length === 4)
        const res = { set: vi.fn(), sendStatus: vi.fn() }
        const log = vi.spyOn(console, 'log').mockImplementation(() => {})
        const err = new Error('boom')

        err.stack = 'Error: boom\n    at handler (/packages/server/lib/routes.ts:1:1)'

        middleware(err, {}, res, vi.fn())

        return { res, log, err }
      }

      it('logs the stack and answers 500 with no error headers', () => {
        const { res, log, err } = handleError()

        expect(log).toHaveBeenCalledWith(err.stack)
        expect(res.set).not.toHaveBeenCalled()
        expect(res.sendStatus).toHaveBeenCalledWith(500)
      })
    })
  })
})
