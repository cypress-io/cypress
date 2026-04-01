import type { NetworkProxy } from '@packages/proxy'
import type { TestingType } from '@packages/types'
import type HttpProxy from 'http-proxy'
import type { RemoteStates } from '../../lib/remote_states'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as express from 'express'
import type { DataContext } from '@packages/data-context'
import { clearCtx, getCtx, setCtx } from '@packages/data-context'

import { createCommonRoutes } from '../../lib/routes'
import { Cfg } from '../../lib/project-base'

/** Minimal context for route tests — avoids loading GraphQL via makeDataContext (Vitest duplicate-realm issue). */
function createRoutesTestContext (): DataContext {
  return {
    coreData: {},
    lifecycleManager: {
      mainProcessWillDisconnect: vi.fn().mockResolvedValue(undefined),
    },
    destroy: vi.fn().mockResolvedValue(undefined),
    _reset: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataContext
}

vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphQLHTTP: vi.fn(),
  }
})

vi.mock('express', () => {
  return {
    Router: vi.fn(),
  }
})

describe('lib/routes', () => {
  // https://github.com/cypress-io/cypress/issues/25891
  describe('https upgrade fix', () => {
    let routeOptions: {
      config: Cfg
      getSpec: ReturnType<typeof vi.fn>
      networkProxy: NetworkProxy
      nodeProxy: HttpProxy
      onError: () => void
      remoteStates: RemoteStates
      testingType: TestingType
    }

    beforeEach(async () => {
      await clearCtx()
      setCtx(createRoutesTestContext())

      routeOptions = {
        config: {
          clientRoute: '/__/',
          namespace: 'namespace',
        } as Cfg,
        getSpec: vi.fn().mockReturnValue({}),
        // @ts-expect-error partial mock
        networkProxy: {
          handleHttpRequest: () => {},
        } as NetworkProxy,
        nodeProxy: {} as HttpProxy,
        onError: () => {},
        // @ts-expect-error partial mock
        remoteStates: {
          hasPrimary: vi.fn().mockReturnValue(true),
          getPrimary: vi.fn().mockReturnValue({
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

    afterEach(async () => {
      await clearCtx()
    })

    function setupCommonRoutes () {
      const router = {
        get: vi.fn(),
        post: vi.fn(),
        all: vi.fn(),
        use: vi.fn(),
      }

      vi.mocked(express.Router).mockReturnValue(router as unknown as express.Router)

      createCommonRoutes(routeOptions)

      return {
        router,
      }
    }

    it('sends 301 if a chrome https upgrade is detected for /', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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

      vi.mocked(res.status).mockReturnValue(res)

      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(301)
      expect(res.redirect).toHaveBeenCalledWith('http://foobar.com/')
    })

    it('sends 301 if a chrome https upgrade is detected for /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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

      vi.mocked(res.status).mockReturnValue(res)

      const next = vi.fn(() => {
        throw new Error('next() should not be called')
      })

      middleware(req, res, next)

      expect(res.status).toHaveBeenCalledWith(301)
      expect(res.redirect).toHaveBeenCalledWith('http://foobar.com/__/')
    })

    it('is a noop if path is neither / nor /__/', () => {
      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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
      vi.mocked(routeOptions.remoteStates.hasPrimary).mockReturnValue(false)

      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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
      vi.mocked(routeOptions.remoteStates.getPrimary).mockReturnValue({
        origin: 'https://foobar.com',
        props: {
          domain: 'foobar',
          tld: 'com',
        },
      } as ReturnType<RemoteStates['getPrimary']>)

      const { router } = setupCommonRoutes()

      const middleware = router.use.mock.calls.find((args) => args[0] === '/')?.[1] as (
        req: Record<string, unknown>,
        res: Record<string, unknown>,
        next: () => void
      ) => void

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
})
