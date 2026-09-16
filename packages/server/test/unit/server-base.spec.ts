import { createRequire } from 'module'
import express from 'express'
import _ from 'lodash'
import nock from 'nock'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import type { Address } from 'net'
import { setupFullConfigWithDefaults } from '@packages/config'
import type { DataContext } from '@packages/data-context'
import { clearCtx, setCtx } from '@packages/data-context'
import { connect } from '@packages/network'
import type { NetworkProxy } from '@packages/proxy'

import { cache } from '../../lib/cache'
import { cypressSessions } from '../../lib/cypress-sessions'
import * as serverErrors from '../../lib/errors'
import * as fileServer from '../../lib/file_server'
import { ServerBase, _forceProxyMiddleware } from '../../lib/server-base'
import { SocketE2E } from '../../lib/socket-e2e'
import * as ensureUrl from '../../lib/util/ensure-url'
import { GracefulExit } from '../../lib/util/graceful-exit'

// Loading the real module here builds the GraphQL schema a second time in this
// worker and `graphql` rejects the duplicate realm. No test asserts on the
// graphql-ws handle, and `close()` skips it when nothing was returned.
vi.mock('@packages/data-context/graphql/makeGraphQLServer', () => {
  return {
    graphqlWS: vi.fn(),
    graphQLHTTP: vi.fn(),
  }
})

// index.js re-exports `create` through a non-configurable getter, so the
// underlying module is the only stubbable seam.
const httpsProxyModule = require('@packages/https-proxy/cjs/proxy')

const morganFn = function () {}

// Set by the morgan mock when `useMorgan` runs.
let lastMorganFactoryArgs

function morganMockFactory (format, options) {
  lastMorganFactoryArgs = { format, options }

  return morganFn
}

// `useMorgan` reaches morgan through a CJS `require`, which `vi.mock` never
// sees, so seed the CJS cache the way mockery did.
const requireCjs = createRequire(import.meta.url)
const morganPath = requireCjs.resolve('morgan')

requireCjs.cache[morganPath] = { exports: morganMockFactory } as NodeModule

// `GracefulExit.resetForTesting` refuses to clear its singleton without this.
const testGlobals = globalThis as { IS_TEST?: boolean }

testGlobals.IS_TEST = true

const originalEnv = _.clone(process.env)

// The suite reaches into the server's protected internals the same way the
// mocha suite did through `this.server`.
type TestServer = any

type CriClientStub = {
  send: Mock
  on: Mock
  off: Mock
  onSend: (command: string, handler: (...args: any[]) => any) => void
}

function getOpenOptions (overrides = {}) {
  return {
    SocketCtor: SocketE2E,
    testingType: 'e2e' as const,
    onError: vi.fn(),
    onWarning: vi.fn(),
    getCurrentBrowser: () => null,
    getSpec: () => null,
    shouldCorrelatePreRequests: () => false,
    ...overrides,
  }
}

function createCriClient (): CriClientStub {
  const handlers: Map<string, (...args: any[]) => any> = new Map()

  return {
    send: vi.fn(async (command: string, ...args: any[]) => {
      const handler = handlers.get(command)

      return handler ? handler(...args) : {}
    }),
    on: vi.fn(),
    off: vi.fn(),
    onSend (command, handler) {
      handlers.set(command, handler)
    },
  }
}

// sinon's `calledWith` ignores trailing arguments an assertion leaves out, so
// match CDP traffic by command rather than restating every argument.
function callsFor (spy: Mock, name: string) {
  return spy.mock.calls.filter(([first]) => first === name)
}

// The browser (CDP) network path is only ever entered by installing the runtime
// that serves it, so tests that need that mode install one against a stub CRI
// client.
function enterBrowserNetworkMode (server: TestServer) {
  server._socket = server._socket ?? {
    toDriver: vi.fn(),
    close: vi.fn(),
    setProtocolManager: vi.fn(),
  }

  server.getCurrentBrowser = server.getCurrentBrowser ?? (() => null)
  server._netStubbingState = server._netStubbingState ?? {
    routes: [],
    requests: {},
    reset: vi.fn(),
  }

  return server.createCdpFetchNetworkRuntime(createCriClient())
}

// Enough for `createCommonRoutes` during `server.open` without standing up a
// full data context.
function serverBaseTestCtx (): DataContext {
  return {
    coreData: {},
    lifecycleManager: {
      mainProcessWillDisconnect: vi.fn().mockResolvedValue(undefined),
    },
    destroy: vi.fn().mockResolvedValue(undefined),
    _reset: vi.fn().mockResolvedValue(undefined),
  } as unknown as DataContext
}

const stubGetFilesByGlob = vi.fn().mockResolvedValue([])

afterAll(() => {
  delete requireCjs.cache[morganPath]
})

describe('lib/server-base', () => {
  let config: any
  let server: TestServer
  let fileServerMock: { close: () => void, port: () => number }
  let oldFileServer: any
  let createFileServer: Mock

  beforeEach(async () => {
    GracefulExit.resetForTesting()

    await clearCtx()
    setCtx(serverBaseTestCtx())

    if (!nock.isActive()) {
      nock.activate()
    }

    nock.disableNetConnect()
    nock.enableNetConnect(/localhost/)

    await cache.remove()

    fileServerMock = {
      close () {},
      port () {
        return 1111
      },
    }

    createFileServer = vi.spyOn(fileServer, 'create').mockResolvedValue(fileServerMock as any) as unknown as Mock

    config = await setupFullConfigWithDefaults({ projectRoot: '/foo/bar/', config: { supportFile: false } }, stubGetFilesByGlob)
    server = new ServerBase(config)

    oldFileServer = server._fileServer
    server._fileServer = fileServerMock
  })

  afterEach(async () => {
    if (server) {
      await server.close()
    }

    vi.restoreAllMocks()

    nock.cleanAll()
    nock.enableNetConnect()

    await clearCtx()

    process.env = _.clone(originalEnv)
  })

  describe('#createExpressApp', () => {
    let use: Mock

    beforeEach(() => {
      use = vi.spyOn(express.application, 'use') as unknown as Mock
    })

    it('instantiates express instance without morgan', () => {
      const app = server.createExpressApp({ morgan: false })

      expect(app.get('view engine')).toBe('html')

      expect(use).not.toHaveBeenCalledWith(morganFn)
    })

    it('requires morgan if true', () => {
      const useMorganStub = vi.spyOn(server, 'useMorgan').mockReturnValue(morganFn)

      server.createExpressApp({ morgan: true })

      expect(useMorganStub).toHaveBeenCalledTimes(1)
    })
  })

  describe('#_createHttpServer', () => {
    it('outlasts Node\'s 5s keep-alive default so our own loopback pool is not closed mid-run', () => {
      const svr = server._createHttpServer(express())

      expect(svr.keepAliveTimeout).toBeGreaterThan(5000)
      svr.close()
    })
  })

  describe('#useMorgan', () => {
    beforeEach(() => {
      GracefulExit.resetForTesting()
      vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
      lastMorganFactoryArgs = undefined
      // CI or other specs may set a low timeout; if the race timer wins before
      // flushAndExit clears processTeardown, skip() still mirrors isShuttingDown
      // and the post-await assertion flakes (see graceful_exit_spec teardown test).
      delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
    })

    afterEach(() => {
      GracefulExit.resetForTesting()
      delete process.env.CYPRESS_INTERNAL_TEARDOWN_TIMEOUT
    })

    it('passes dev format and skip that mirrors GracefulExit.isShuttingDown', async () => {
      server.useMorgan()

      const req = { proxiedUrl: '/__cypress/iframes/foo', headers: {} }

      expect(lastMorganFactoryArgs.format).toBe('dev')
      expect(lastMorganFactoryArgs.options.skip(req)).toBe(false)

      let resolveStep

      const stepPromise = new Promise((resolve) => {
        resolveStep = resolve
      })

      GracefulExit.addStep(() => stepPromise, 'slow-step')

      const exitPromise = GracefulExit.exitGracefully(0)

      expect(lastMorganFactoryArgs.options.skip(req)).toBe(true)

      resolveStep()

      await exitPromise

      expect(lastMorganFactoryArgs.options.skip(req)).toBe(false)
    })

    describe('tap request logging', () => {
      beforeEach(() => {
        vi.spyOn(cypressSessions, 'getCurrent').mockReturnValue({ sessionId: 'abc' } as any)
        server.useMorgan()
      })

      const skip = (proxiedUrl: string, headers = {}) => {
        return lastMorganFactoryArgs.options.skip({ proxiedUrl, headers })
      }

      it('skips the non-proxied session probe', () => {
        expect(skip('/__cypress/sessions/abc')).toBe(true)
      })

      it('skips a non-proxied tap graphql request carrying the current session id', () => {
        expect(skip('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' })).toBe(true)
      })

      it('logs a tap graphql request whose session id header does not match', () => {
        expect(skip('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'nope' })).toBe(false)
      })

      it('logs a graphql request from the app, which sends no session id header', () => {
        expect(skip('/__cypress/graphql/Specs')).toBe(false)
      })

      it('logs a proxied request that mimics the probe path', () => {
        expect(skip('http://example.com/__cypress/sessions/abc')).toBe(false)
      })

      it('logs everything else', () => {
        expect(skip('/__cypress/iframes/foo')).toBe(false)
      })
    })
  })

  describe('#open', () => {
    beforeEach(() => {
      vi.spyOn(server, 'createServer').mockResolvedValue(undefined)
    })

    it('calls #createExpressApp with morgan', async () => {
      const createExpressApp = vi.spyOn(server, 'createExpressApp')

      _.extend(config, { port: 54321, morgan: false })

      await server.open(config, getOpenOptions())

      expect(createExpressApp).toHaveBeenCalledWith(expect.objectContaining({ morgan: false }))
    })

    it('calls #createServer with app and config', async () => {
      _.extend(config, { port: 54321 })
      const app = { use: vi.fn() }

      vi.spyOn(server, 'createExpressApp').mockReturnValue(app)

      await server.open(config, getOpenOptions())

      expect(server.createServer).toHaveBeenCalledWith(app, config, expect.any(Function))
    })

    // The browser is unknown at open, so the MITM runtime must always be built:
    // a later Firefox/WebKit launch has nothing else to fall back to.
    it('creates networkProxy regardless of forceHttp1', async () => {
      _.extend(config, { port: 54321, forceHttp1: false })
      const app = { use: vi.fn() }

      vi.spyOn(server, 'createExpressApp').mockReturnValue(app)

      const createNetworkProxy = vi.spyOn(server, 'createNetworkProxy')

      await server.open(config, getOpenOptions())

      expect(createNetworkProxy).toHaveBeenCalled()
      expect(server._networkProxy).toBeDefined()
      expect(server._netStubbingState).toBeDefined()
    })

    it('does not create the https proxy at open', async () => {
      _.extend(config, { port: 54321 })
      const app = { use: vi.fn() }

      vi.spyOn(server, 'createExpressApp').mockReturnValue(app)

      await server.open(config, getOpenOptions())

      expect(server._httpsProxy).toBeUndefined()
    })
  })

  describe('#setNetworkMode', () => {
    let netStubbingState: { id: string }
    let ensureHttpsProxy: Mock

    beforeEach(() => {
      server._openConfig = config
      server._proxyRuntime = {
        networkProxy: { id: 'mitm' },
      }

      netStubbingState = { id: 'owned-by-open' }
      server._netStubbingState = netStubbingState

      ensureHttpsProxy = vi.spyOn(server, 'ensureHttpsProxy').mockResolvedValue(undefined) as unknown as Mock
    })

    it('publishes the MITM path, and its https proxy, for a launch that needs the proxy', async () => {
      await server.setNetworkMode(false)

      expect(server.isBrowserNetworkMode()).toBe(false)
      expect(ensureHttpsProxy).toHaveBeenCalled()
      expect(server._networkProxy).toBe(server._proxyRuntime.networkProxy)
    })

    // The CDP runtime needs the page CRI client, which does not exist yet, so
    // claiming the browser network mode here would point every request-time gate
    // at a pipeline that cannot serve it.
    it('does not claim the browser network mode before its runtime exists', async () => {
      await server.setNetworkMode(false)
      await server.setNetworkMode(true)

      expect(server.isBrowserNetworkMode()).toBe(false)
      expect(server._networkProxy).toBe(server._proxyRuntime.networkProxy)
    })

    it('leaves the https proxy alone for a browser network launch, so no root CA is generated', async () => {
      await server.setNetworkMode(true)

      expect(ensureHttpsProxy).not.toHaveBeenCalled()
    })

    // A browser switch in open mode relaunches against this same instance, and
    // nothing else tears the CDP Fetch runtime down.
    it('stops the CDP runtime and restores the proxy runtime when switching back', async () => {
      const cdpNetworkProxy = { dispose: vi.fn() }
      const stop = vi.fn().mockResolvedValue(undefined)

      server._cdpFetchRuntime = { networkProxy: cdpNetworkProxy, stop }
      server._networkProxy = cdpNetworkProxy
      server._networkMode = 'browser'

      await server.setNetworkMode(false)

      expect(server.isBrowserNetworkMode()).toBe(false)
      expect(stop).toHaveBeenCalled()
      expect(server._cdpFetchRuntime).toBeUndefined()
      expect(server._networkProxy).toBe(server._proxyRuntime.networkProxy)
      // the server owns the netStubbingState, so a runtime handoff must not move it
      expect(server._netStubbingState).toBe(netStubbingState)
    })

    // The old browser stays alive until browsers.open kills it, so it issues
    // requests across every awaited step of the switch. A step where the mode
    // and the installed NetworkProxy disagree routes those into the pipeline
    // that is not installed.
    it('never publishes a mode the installed NetworkProxy cannot serve', async () => {
      const cdpNetworkProxy = { dispose: vi.fn() }
      const samples: { cdp: boolean, proxy: unknown }[] = []
      const sample = () => {
        samples.push({ cdp: server.isBrowserNetworkMode(), proxy: server._networkProxy })
      }

      ensureHttpsProxy.mockImplementation(async () => sample())

      server._cdpFetchRuntime = {
        networkProxy: cdpNetworkProxy,
        stop: vi.fn(async () => sample()),
      }

      server._networkProxy = cdpNetworkProxy
      server._networkMode = 'browser'

      sample()
      await server.setNetworkMode(false)
      sample()

      expect(samples).toHaveLength(4)
      samples.forEach(({ cdp, proxy }, index) => {
        expect(cdp, `sample ${index} reads CDP only while the CDP proxy is installed`).toBe(proxy === cdpNetworkProxy)
      })
    })
  })

  describe('#ensureHttpsProxy', () => {
    it('creates the https proxy once, on demand', async () => {
      const app = server.createExpressApp({ morgan: false })

      await server.createServer(app, {})

      expect(server._httpsProxy).toBeUndefined()

      await server.ensureHttpsProxy()

      const httpsProxy = server._httpsProxy

      expect(httpsProxy).toBeDefined()

      await server.ensureHttpsProxy()

      expect(server._httpsProxy).toBe(httpsProxy)
    })

    // The proxy binds against this server's port; resolving without one would
    // read as "already created" and defer CA generation into a TLS handshake.
    it('rejects when the server is not listening yet', async () => {
      let err

      try {
        await server.ensureHttpsProxy()
      } catch (e) {
        err = e
      }

      expect(err?.message).toContain('createServer must first be called')
      expect(server._httpsProxy).toBeUndefined()
      expect(server._httpsProxyReady).toBeUndefined()
    })

    // Memoizing the rejection would make one transient failure fatal for every
    // later launch and CONNECT in the session.
    it('does not memoize a failure, so a later launch retries', async () => {
      const app = server.createExpressApp({ morgan: false })

      await server.createServer(app, {})

      const create = vi.spyOn(httpsProxyModule, 'create')
      .mockRejectedValueOnce(new Error('EACCES: cannot write the root CA'))
      .mockResolvedValueOnce({ close: vi.fn().mockResolvedValue(undefined) })

      let err

      try {
        await server.ensureHttpsProxy()
      } catch (e) {
        err = e
      }

      expect(err?.message).toContain('EACCES')
      expect(server._httpsProxyReady).toBeUndefined()

      await server.ensureHttpsProxy()

      expect(server._httpsProxy).toBeDefined()
      expect(create).toHaveBeenCalledTimes(2)
    })
  })

  describe('#closeHttpsProxy', () => {
    // Closing mid-creation used to close nothing, then leave a fully listening
    // SNI server with no owner holding its port.
    it('closes an https proxy that finishes creating during close()', async () => {
      const app = server.createExpressApp({ morgan: false })

      await server.createServer(app, {})

      const close = vi.fn().mockResolvedValue(undefined)
      let finishCreation

      vi.spyOn(httpsProxyModule, 'create').mockReturnValue(new Promise((resolve) => {
        finishCreation = () => resolve({ close })
      }))

      const ready = server.ensureHttpsProxy()
      const closing = server.close()

      finishCreation()

      await ready
      await closing

      expect(close).toHaveBeenCalledTimes(1)
      expect(server._httpsProxy).toBeUndefined()
      // a stale memo would hand out a proxy bound to a destroyed http server
      expect(server._httpsProxyReady).toBeUndefined()
    })
  })

  describe('#createCdpFetchNetworkRuntime', () => {
    const createClient = createCriClient

    beforeEach(() => {
      server._openConfig = config
      server._socket = {
        toDriver: vi.fn(),
        close: vi.fn(),
        setProtocolManager: vi.fn(),
      }

      server.getCurrentBrowser = () => null
      server._netStubbingState = {
        routes: [],
        requests: {},
        reset: vi.fn(),
      }
    })

    it('starts the CDP Fetch runtime and exposes its network context', async () => {
      const client = createClient()
      const isAUTFrame = vi.fn().mockResolvedValue(false)

      await server.createCdpFetchNetworkRuntime(client, isAUTFrame)

      expect(callsFor(client.on, 'Fetch.requestPaused')).not.toHaveLength(0)
      expect(callsFor(client.send, 'Fetch.enable')[0][1]).toEqual({
        patterns: [{
          requestStage: 'Request',
        }, {
          requestStage: 'Response',
        }],
      })

      expect(server._cdpFetchRuntime).toBeDefined()
      expect(server._netStubbingState).toBeDefined()
      // The request-time ctx reads its interception core off the installed
      // NetworkProxy, so this observes the pointers production middleware
      // observes.
      expect(server._networkProxy).toBe(server._cdpFetchRuntime.networkProxy)
      expect(server._networkProxy.http.networkInterceptionCore).toBe(server._cdpFetchRuntime.networkInterceptionCore)
    })

    // Publishing the mode any earlier would point the request-time gates at a
    // CDP pipeline that does not exist yet; any later would leave them on MITM
    // semantics while the CDP NetworkProxy is already installed.
    it('publishes the browser network mode together with the runtime that serves it', async () => {
      const client = createClient()
      const modeDuringStart: boolean[] = []

      // Fetch.enable is the last step of start()
      client.onSend('Fetch.enable', async () => {
        modeDuringStart.push(server.isBrowserNetworkMode())
      })

      expect(server.isBrowserNetworkMode()).toBe(false)

      await server.createCdpFetchNetworkRuntime(client)

      expect(server.isBrowserNetworkMode()).toBe(true)
      expect(server._networkProxy).toBe(server._cdpFetchRuntime.networkProxy)
      expect(modeDuringStart).toEqual([true])
    })

    // DriverInterceptRegistrationAdapter binds to the state object created at open,
    // so a launch that replaced it would leave every cy.intercept() registered
    // against a state the installed runtime never matches.
    it('keeps one netStubbingState across open, a browser-path launch, and the switch back', async () => {
      _.extend(config, { port: 54321 })
      vi.spyOn(server, 'createExpressApp').mockReturnValue({ use: vi.fn() })
      vi.spyOn(server, 'createServer').mockResolvedValue(undefined)
      vi.spyOn(server, 'ensureHttpsProxy').mockResolvedValue(undefined)

      await server.open(config, getOpenOptions())

      const state = server._netStubbingState

      expect(state).toBeDefined()
      expect(server._networkProxy.http.netStubbingState).toBe(state)

      await server.createCdpFetchNetworkRuntime(createClient())

      expect(server.isBrowserNetworkMode()).toBe(true)
      expect(server._netStubbingState).toBe(state)
      expect(server._networkProxy.http.netStubbingState).toBe(state)

      await server.setNetworkMode(false)

      expect(server.isBrowserNetworkMode()).toBe(false)
      expect(server._netStubbingState).toBe(state)
      expect(server._networkProxy.http.netStubbingState).toBe(state)
    })

    // Each runtime constructs its interception core (and the policy
    // registration inside it) into its own NetworkProxy, and the middleware
    // ctx reads the core off whichever NetworkProxy is installed. So the
    // handoff invariant — every shared runtime pointer moves with
    // `_networkMode` in one synchronous step — is observable here: after each
    // switch, the middleware-visible core must be the active runtime's, never
    // the other one's.
    it('hands the middleware-visible interception core over with the runtime, in both directions', async () => {
      _.extend(config, { port: 54321 })
      vi.spyOn(server, 'createExpressApp').mockReturnValue({ use: vi.fn() })
      vi.spyOn(server, 'createServer').mockResolvedValue(undefined)
      vi.spyOn(server, 'ensureHttpsProxy').mockResolvedValue(undefined)

      await server.open(config, getOpenOptions())

      const mitmCore = server._proxyRuntime.networkInterceptionCore

      expect(server._networkProxy.http.networkInterceptionCore).toBe(mitmCore)

      await server.createCdpFetchNetworkRuntime(createClient())

      const cdpCore = server._cdpFetchRuntime.networkInterceptionCore

      expect(cdpCore).not.toBe(mitmCore)
      expect(server.isBrowserNetworkMode()).toBe(true)
      expect(server._networkProxy.http.networkInterceptionCore).toBe(cdpCore)

      await server.setNetworkMode(false)

      expect(server.isBrowserNetworkMode()).toBe(false)
      expect(server._networkProxy.http.networkInterceptionCore).toBe(mitmCore)
    })

    it('applies a previously stored protocol manager to the late-bound CDP NetworkProxy', async () => {
      const client = createClient()
      const protocolManager = { isProtocolEnabled: true } as any

      server.setProtocolManager(protocolManager)
      server.setPreRequestTimeout(1234)

      expect(server._networkProxy).toBeUndefined()

      await server.createCdpFetchNetworkRuntime(client)

      expect(server._networkProxy.http.preRequests.protocolManager).toBe(protocolManager)
      expect(server._networkProxy.http.preRequests.requestTimeout).toBe(1234)
    })

    it('clears _networkProxy before disposing the previous CDP runtime', async () => {
      const client = createClient()

      await server.createCdpFetchNetworkRuntime(client)

      const firstProxy = server._networkProxy
      let networkProxyDuringDispose: NetworkProxy | undefined | null = null

      vi.spyOn(firstProxy, 'dispose').mockImplementation(() => {
        networkProxyDuringDispose = server._networkProxy
      })

      await server['swapCdpFetchRuntime']()

      expect(networkProxyDuringDispose).toBeUndefined()
      expect(server._networkProxy).toBeUndefined()
    })

    it('stops the previous CDP Fetch runtime before replacing it', async () => {
      const firstClient = createClient()
      const secondClient = createClient()

      await server.createCdpFetchNetworkRuntime(firstClient)

      const firstProxy = server._networkProxy
      const disposeSpy = vi.spyOn(firstProxy, 'dispose')

      await server.createCdpFetchNetworkRuntime(secondClient)

      expect(callsFor(firstClient.send, 'Fetch.disable')).not.toHaveLength(0)
      expect(disposeSpy).toHaveBeenCalledTimes(1)
      expect(callsFor(secondClient.send, 'Fetch.enable')).not.toHaveLength(0)
      expect(server._networkProxy).not.toBe(firstProxy)
    })

    // A replacement (spec change, new tab, relaunch) leaves the browser on the
    // native path throughout, so the mode must never transit 'proxy' while the
    // outgoing runtime is stopping: the request-time gates would redirect the
    // browser's path-only requests to the client route and hand them to a
    // pipeline that expects absolute-form URLs.
    it('never publishes the MITM path while a replaced CDP runtime is still stopping', async () => {
      _.extend(config, { port: 54321 })
      vi.spyOn(server, 'createExpressApp').mockReturnValue({ use: vi.fn() })
      vi.spyOn(server, 'createServer').mockResolvedValue(undefined)

      await server.open(config, getOpenOptions())

      const mitmProxy = server._networkProxy
      const firstClient = createClient()
      const secondClient = createClient()

      await server.createCdpFetchNetworkRuntime(firstClient)

      let releaseFetchDisable: (() => void) | undefined

      firstClient.onSend('Fetch.disable', () => {
        return new Promise<void>((resolve) => {
          releaseFetchDisable = resolve
        })
      })

      const replacing = server.createCdpFetchNetworkRuntime(secondClient)

      expect(typeof releaseFetchDisable, 'the outgoing runtime is mid-teardown').toBe('function')
      expect(server.isBrowserNetworkMode(), 'network mode mid-swap').toBe(true)
      expect(server._networkProxy, 'installed proxy mid-swap').not.toBe(mitmProxy)
      // one session cannot have two Fetch owners, so the successor waits
      expect(callsFor(secondClient.send, 'Fetch.enable')).toHaveLength(0)

      releaseFetchDisable!()

      await replacing

      expect(server.isBrowserNetworkMode()).toBe(true)
      expect(server._networkProxy).toBe(server._cdpFetchRuntime.networkProxy)
      expect(callsFor(secondClient.send, 'Fetch.enable')).not.toHaveLength(0)
    })

    it('disposes NetworkProxy only after Fetch.disable completes', async () => {
      const client = createClient()

      await server.createCdpFetchNetworkRuntime(client)

      const proxy = server._networkProxy
      const disposeSpy = vi.spyOn(proxy, 'dispose')
      let disposeDuringFetchDisable = false

      client.onSend('Fetch.disable', async () => {
        disposeDuringFetchDisable = disposeSpy.mock.calls.length > 0
      })

      await server['swapCdpFetchRuntime']()

      expect(disposeDuringFetchDisable).toBe(false)
      expect(callsFor(client.send, 'Fetch.disable')).not.toHaveLength(0)
      expect(disposeSpy).toHaveBeenCalledTimes(1)
    })

    it('still starts the new runtime when stopping the previous one fails', async () => {
      const firstClient = createClient()
      const secondClient = createClient()

      await server.createCdpFetchNetworkRuntime(firstClient)

      // the previous page client is typically gone by the time a new spec or
      // relaunch replaces the runtime
      firstClient.onSend('Fetch.disable', () => {
        throw new Error('Fetch.disable will not run as the target browser or tab CRI connection has crashed')
      })

      await server.createCdpFetchNetworkRuntime(secondClient)

      expect(callsFor(secondClient.send, 'Fetch.enable')).not.toHaveLength(0)
      expect(server._cdpFetchRuntime).toBeDefined()
    })

    it('resets CDP Fetch between tests without disabling Fetch', async () => {
      const client = createClient()

      await server.createCdpFetchNetworkRuntime(client)
      client.send.mockClear()

      server['resetCdpFetchRuntime']()

      expect(callsFor(client.send, 'Fetch.disable')).toHaveLength(0)
    })

    it('stops and disposes the CDP Fetch runtime on server close', async () => {
      const client = createClient()

      await server.createCdpFetchNetworkRuntime(client)

      const proxy = server._networkProxy
      const disposeSpy = vi.spyOn(proxy, 'dispose')

      vi.spyOn(server._remoteStates, 'set').mockReturnValue(undefined)
      server.isListening = true
      server._server = {
        destroyAsync: vi.fn().mockResolvedValue(undefined),
      }

      await server['_close']()

      expect(disposeSpy).toHaveBeenCalledTimes(1)
      expect(callsFor(client.send, 'Fetch.disable')).not.toHaveLength(0)
      expect(server._cdpFetchRuntime).toBeUndefined()
      expect(server._networkProxy).toBeUndefined()
    })

    // The runner document and an AUT document escape the same way but need
    // different remedies, so the warning has to tell them apart.
    describe('interception escape warning', () => {
      async function escape (server: TestServer, url: string) {
        const client = createClient()

        await server.createCdpFetchNetworkRuntime(client)

        // the transport listens for this event alongside the escape detector,
        // so deliver it to every listener the way the connection would
        callsFor(client.on, 'Network.responseReceived').forEach(([, listener]) => {
          listener({
            requestId: '1',
            type: 'Document',
            response: { url, fromServiceWorker: true },
          })
        })
      }

      beforeEach(() => {
        vi.spyOn(serverErrors, 'warning').mockReturnValue(undefined)
      })

      it('reports an escaped runner document as one', async () => {
        await escape(server, 'https://example.com/__/#/specs/runner?file=cypress/e2e/spec.cy.js')

        expect(serverErrors.warning).toHaveBeenCalledTimes(1)
        expect(serverErrors.warning).toHaveBeenCalledWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', expect.any(String), true)
      })

      it('reports an escaped runner asset as a runner document', async () => {
        await escape(server, 'https://example.com/__cypress/iframes/integration/spec.cy.js')

        expect(serverErrors.warning).toHaveBeenCalledTimes(1)
        expect(serverErrors.warning).toHaveBeenCalledWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', expect.any(String), true)
      })

      it('reports an escaped AUT document as one', async () => {
        await escape(server, 'https://example.com/dashboard')

        expect(serverErrors.warning).toHaveBeenCalledTimes(1)
        expect(serverErrors.warning).toHaveBeenCalledWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', expect.any(String), false)
      })

      it('falls back to the generic variant when the escaped url cannot be parsed', async () => {
        await escape(server, 'http://')

        expect(serverErrors.warning).toHaveBeenCalledTimes(1)
        expect(serverErrors.warning).toHaveBeenCalledWith('BROWSER_NETWORK_INTERCEPTION_ESCAPE', expect.any(String), false)
      })
    })
  })

  describe('#attachCdpFetchExtraTarget', () => {
    const createClient = createCriClient

    beforeEach(() => {
      server._openConfig = config
      server._socket = {
        toDriver: vi.fn(),
        close: vi.fn(),
        setProtocolManager: vi.fn(),
      }

      server.getCurrentBrowser = () => null
      server._netStubbingState = {
        routes: [],
        requests: {},
        reset: vi.fn(),
      }
    })

    it('delegates to the CDP Fetch runtime when present', async () => {
      const pageClient = createClient()
      const extraClient = createClient()

      await server.createCdpFetchNetworkRuntime(pageClient)

      const detach = vi.fn().mockResolvedValue(undefined)
      const attachExtraTarget = vi.spyOn(server._cdpFetchRuntime, 'attachExtraTarget').mockResolvedValue(detach)

      const result = await server.attachCdpFetchExtraTarget(extraClient)

      expect(attachExtraTarget).toHaveBeenCalledTimes(1)
      expect(attachExtraTarget).toHaveBeenCalledWith(extraClient)
      expect(result).toBe(detach)
    })

    it('returns undefined when there is no CDP Fetch runtime', async () => {
      const result = await server.attachCdpFetchExtraTarget(createClient())

      expect(result).toBeUndefined()
    })
  })

  describe('#createServer', () => {
    let port: number
    let app: any

    beforeEach(() => {
      port = 54321
      app = server.createExpressApp({ morgan: true })
    })

    describe('remote state', () => {
      let listen: Mock

      beforeEach(() => {
        listen = vi.spyOn(server, '_listen').mockImplementation((p) => Promise.resolve(p)) as unknown as Mock
        vi.spyOn(server, '_port').mockReturnValue(port)
      })

      it('sets remote state to baseUrl when baseUrl is provided', async () => {
        vi.spyOn(ensureUrl, 'isListening').mockResolvedValue(undefined)
        const setSpy = vi.spyOn(server._remoteStates, 'set')

        await server.createServer(app, { port, baseUrl: 'http://localhost:9999' })

        expect(setSpy).toHaveBeenCalledWith('http://localhost:9999')
      })

      it('sets remote state to <root> when baseUrl is not provided', async () => {
        const setSpy = vi.spyOn(server._remoteStates, 'set')

        await server.createServer(app, { port })

        expect(setSpy).toHaveBeenCalledWith('<root>')
      })

      it('calls fileServer.create before _listen', async () => {
        // fileServer.create is awaited before _listen so its
        // port is known when the primary remote state is computed via
        // _stateFromUrl('<root>').
        await server.createServer(app, { port })

        expect(createFileServer.mock.invocationCallOrder[0]).toBeLessThan(listen.mock.invocationCallOrder[0])
      })

      it('establishes primary remote state after fileServer is ready', async () => {
        // `_fileServer` must already exist when `_remoteStates.set` runs — its
        // port is read synchronously by `_stateFromUrl('<root>')`.
        let fileServerAtSetCall

        const realSet = server._remoteStates.set.bind(server._remoteStates)
        const setStub = vi.spyOn(server._remoteStates, 'set').mockImplementation((...args) => {
          fileServerAtSetCall = server._fileServer

          return realSet(...args)
        })

        await server.createServer(app, { port })

        expect(setStub).toHaveBeenCalledTimes(1)
        expect(setStub).toHaveBeenCalledWith('<root>')
        expect(fileServerAtSetCall, 'fileServer must be ready when set runs').toBeDefined()
      })

      // The https proxy is only needed on the MITM path, so it waits for a
      // browser that needs it rather than generating a root CA at every open.
      it('does not create httpsProxy', async () => {
        await server.createServer(app, { port })

        expect(server._httpsProxy).toBeUndefined()
      })

      it('registers connect listener', async () => {
        await server.createServer(app, { port })

        expect(server.server.listenerCount('connect')).toBeGreaterThan(0)
      })
    })

    it('isListening=true', async () => {
      await server.createServer(app, { port })

      expect(server.isListening).toBe(true)
    })

    it('resolves with http server port', async () => {
      const [listenedPort] = await server.createServer(app, { port })

      expect(listenedPort).toBe(port)
    })

    it('all servers listen only on localhost and no other interface', async () => {
      // Real TCP to another interface is out of reach on a sandboxed host (no
      // second NIC, and RFC5737 space is unroutable), so only the loopback half
      // of each probe reaches a real socket.
      const realByPortAndAddress = connect.byPortAndAddress.bind(connect)

      vi.spyOn(connect, 'byPortAndAddress').mockImplementation((p, addr: any) => {
        if (addr === '127.0.0.1' || addr?.address === '127.0.0.1') {
          return realByPortAndAddress(p, addr)
        }

        return Promise.reject(Object.assign(new Error('refused'), { code: 'ECONNREFUSED' }))
      })

      createFileServer.mockRestore()
      server._fileServer = oldFileServer

      const nonLoopback: Address = {
        address: '192.0.2.1',
        family: 'IPv4',
        port: 0,
      }

      // byPortAndAddress has no timeout; connecting to non-loopback with nothing listening
      // can hang until TCP timeout. Cap wait so the test doesn't hang.
      const connectTimeoutMs = 1000

      // verify that we can connect to `port` over loopback
      // and not over another configured IPv4 address
      const tryOnlyLoopbackConnect = (p: number) => {
        const nonLoopbackAttempt = Promise.race([
          connect.byPortAndAddress(p, nonLoopback),
          new Promise((_resolve, reject) => setTimeout(() => reject(new Error('connect timeout')), connectTimeoutMs)),
        ])

        return Promise.all([
          connect.byPortAndAddress(p, '127.0.0.1' as any),
          nonLoopbackAttempt
          .then(() => {
            throw new Error(`Shouldn't be able to connect on ${nonLoopback.address}:${p}`)
          }).catch((err) => {
            if (err.code === 'ECONNREFUSED' || err.message === 'connect timeout') return

            throw err
          }),
        ])
      }

      const [listenedPort] = await server.createServer(app, {})

      await server.ensureHttpsProxy()

      await Promise.all([
        listenedPort,
        server._fileServer.port(),
        server._httpsProxy._sniPort,
      ].map(tryOnlyLoopbackConnect))
    })

    it('resolves with warning if cannot connect to baseUrl', async () => {
      vi.spyOn(ensureUrl, 'isListening').mockRejectedValue(new Error('cannot reach base url for test'))

      const [, warning] = await server.createServer(app, { port, baseUrl: `http://localhost:${port}` })

      expect(warning.type).toBe('CANNOT_CONNECT_BASE_URL_WARNING')

      expect(warning.message).toContain(String(port))
    })

    describe('errors', () => {
      it('rejects with portInUse', async () => {
        await server.createServer(app, { port })

        await expect(server.createServer(app, { port })).rejects.toMatchObject({
          type: 'PORT_IN_USE_SHORT',
          message: expect.stringContaining(String(port)),
        })
      })
    })
  })

  describe('#end', () => {
    it('calls this._socket.end', () => {
      const socket = {
        end: vi.fn(),
        close: vi.fn(),
      }

      server._socket = socket

      server.end()

      expect(socket.end).toHaveBeenCalled()
    })

    it('is noop without this._socket', () => {
      server.end()
    })
  })

  describe('#startWebsockets', () => {
    let startListening: Mock

    beforeEach(() => {
      startListening = vi.spyOn(SocketE2E.prototype, 'startListening').mockImplementation(() => undefined as any) as unknown as Mock
    })

    it('sets _socket and calls _socket#startListening', async () => {
      await server.open(config, getOpenOptions())

      const arg2 = {}

      server.startWebsockets(1, 2, arg2)

      expect(startListening).toHaveBeenCalledWith(server.getHttpServer(), 1, 2, arg2)
    })

    describe('onResetServerState', () => {
      let websocketOptions: Record<string, any>

      beforeEach(async () => {
        config.blockHosts = 'localhost:3131'

        await server.open(config, getOpenOptions())

        websocketOptions = {}
        server.startWebsockets(1, 2, websocketOptions)
      })

      it('applies the blockHosts value the driver resolved for the upcoming test', () => {
        websocketOptions.onResetServerState({ blockHosts: ['*.pendo.io'] })

        expect(server._openConfig.blockHosts).toEqual(['*.pendo.io'])
      })

      it('applies null so an override can clear blocking', () => {
        websocketOptions.onResetServerState({ blockHosts: null })

        expect(server._openConfig.blockHosts).toBeNull()
      })

      it('leaves blockHosts alone when the payload omits it', () => {
        websocketOptions.onResetServerState({})

        expect(server._openConfig.blockHosts).toBe('localhost:3131')
      })

      it('leaves blockHosts alone when there is no payload', () => {
        websocketOptions.onResetServerState()

        expect(server._openConfig.blockHosts).toBe('localhost:3131')
      })

      it('is read by the network runtime, which shares the config object', () => {
        websocketOptions.onResetServerState({ blockHosts: ['*.pendo.io'] })

        expect(server._networkProxy.http.config.blockHosts).toEqual(['*.pendo.io'])
      })
    })

    // The CDP Fetch runtime swaps NetworkProxy at each launch, so the getter must
    // read whichever instance is current rather than capture one.
    it('reads the rendered-HTML-origins map off the current network proxy', async () => {
      await server.open(config, getOpenOptions())

      const options: Record<string, any> = {}

      server.startWebsockets(1, 2, options)

      server._networkProxy.http.getRenderedHTMLOrigins()['http://example.com'] = true

      expect(options.getRenderedHTMLOrigins()).toEqual({ 'http://example.com': true })

      server._networkProxy = undefined

      expect(options.getRenderedHTMLOrigins()).toEqual({})
    })
  })

  describe('#reset', () => {
    let buffers: any

    beforeEach(async () => {
      await server.open(config, getOpenOptions())

      buffers = server._networkProxy.http

      vi.spyOn(buffers, 'reset').mockReturnValue(undefined)
    })

    it('resets the buffers', () => {
      server.reset()

      expect(buffers.reset).toHaveBeenCalled()
    })

    it('restores the project-level blockHosts so an override cannot leak into the next spec', () => {
      server._projectBlockHosts = 'localhost:3131'
      server._openConfig.blockHosts = null

      server.reset()

      expect(server._openConfig.blockHosts).toBe('localhost:3131')
    })

    it('sets the domain to the previous base url if set', () => {
      server._baseUrl = 'http://localhost:3000'
      server.reset()

      expect(server._remoteStates.current().strategy).toBe('http')
    })

    it('sets the domain to <root> if not set', () => {
      server.reset()

      expect(server._remoteStates.current().strategy).toBe('file')
    })
  })

  describe('#close', () => {
    it('resolves true successfully bailing out early', async () => {
      const res = await server.close()

      expect(res[0]).toBe(true)
    })

    it('returns a promise', () => {
      expect(typeof server.close().then).toBe('function')
    })

    it('calls close on this.server', async () => {
      await server.open(config, getOpenOptions())

      await server.close()
    })

    it('isListening=false', async () => {
      await server.open(config, getOpenOptions())

      await server.close()

      expect(server.isListening).toBe(false)
    })

    it('calls close on this._socket', async () => {
      server._socket = { close: vi.fn() }

      await server.close()

      expect(server._socket.close).toHaveBeenCalledTimes(1)
    })

    // The standing MITM runtime outlives every launch, and a ServerBase is
    // created per ProjectBase.open() — so without this its PreRequests sweep
    // timer and the Http graph behind it accumulate per project open.
    it('disposes the standing MITM NetworkProxy', async () => {
      await server.open(config, getOpenOptions())

      const dispose = vi.spyOn(server._proxyRuntime.networkProxy, 'dispose')

      await server.close()

      expect(dispose).toHaveBeenCalledTimes(1)
      expect(server._networkProxy).toBeUndefined()
      expect(server._proxyRuntime).toBeUndefined()
    })
  })

  describe('#proxyWebsockets', () => {
    let proxy: { ws: Mock, on: Mock }
    let socket: { end: Mock, writable?: boolean }
    let head: Record<string, unknown>

    beforeEach(() => {
      proxy = {
        ws: vi.fn(),
        on: vi.fn(),
      }

      socket = { end: vi.fn() }
      head = {}
    })

    it('is noop if req.url startsWith socketIoRoute', () => {
      const remotePort = 12345
      const req = {
        url: '/foobarbaz',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }

      server.socketAllowed.add({
        localPort: remotePort,
        once: _.noop,
      })

      const noop = server.proxyWebsockets(proxy, '/foo', req, socket, head)

      expect(noop).toBeUndefined()
    })

    // The CONNECT allow-list is a live registry of open proxy sockets, so a
    // stretch on the browser (CDP) network path (which never CONNECTs) leaves it
    // empty. A MITM browser repopulates it via onConnect before it upgrades, so
    // nothing needs to clear it on a switch.
    it('switches gates between loopback and the CONNECT allow-list', async () => {
      server._openConfig = config

      const remotePort = 12345
      const req = {
        url: '/foo/bar',
        socket: { remotePort, remoteAddress: '127.0.0.1' },
      }
      const write = vi.fn()

      await enterBrowserNetworkMode(server)

      server.proxyWebsockets(proxy, '/foo', req, { ...socket, write }, head)

      expect(write, 'loopback is the only gate on the browser (CDP) network path').not.toHaveBeenCalled()
      expect(server.socketAllowed.allowedLocalPorts).toHaveLength(0)

      vi.spyOn(server, 'ensureHttpsProxy').mockResolvedValue(undefined)
      await server.setNetworkMode(false)

      server.proxyWebsockets(proxy, '/foo', req, { ...socket, write }, head)

      expect(write, 'an unregistered port is refused on the MITM path').toHaveBeenCalled()

      write.mockClear()
      server.socketAllowed.add({ localPort: remotePort, once: _.noop })

      server.proxyWebsockets(proxy, '/foo', req, { ...socket, write }, head)

      expect(write, 'the CONNECT that precedes the upgrade re-registers the port').not.toHaveBeenCalled()
    })

    it('calls proxy.ws with hostname + port', () => {
      server.remoteStates.set('https://www.google.com')

      const req = {
        connection: {
          encrypted: true,
        },
        url: '/',
        headers: {
          host: 'www.google.com',
        },
      }

      server.proxyWebsockets(proxy, '/foo', req, socket, head)

      expect(proxy.ws).toHaveBeenCalledWith(
        req,
        socket,
        head,
        expect.objectContaining({
          secure: false,
          target: {
            host: 'www.google.com',
            port: '443',
            protocol: 'https:',
          },
        }),
        expect.any(Function),
      )
    })

    it('ends the socket if its writable and there is no __cypress.remoteHost', () => {
      const req = {
        url: '/',
        headers: {
          cookie: 'foo=bar',
        },
      }

      server.proxyWebsockets(proxy, '/foo', req, socket, head)
      expect(socket.end).not.toHaveBeenCalled()

      socket.writable = true
      server.proxyWebsockets(proxy, '/foo', req, socket, head)

      expect(socket.end).toHaveBeenCalled()
    })
  })

  describe('#_forceProxyMiddleware', () => {
    const clientRoute = '/__/'
    let getCurrent: Mock

    beforeEach(() => {
      getCurrent = vi.spyOn(cypressSessions, 'getCurrent') as unknown as Mock
    })

    const run = (req, { clientRoute: route = clientRoute, namespace }: { clientRoute?: string, namespace?: string } = {}) => {
      const res = { redirect: vi.fn() }
      const next = vi.fn()

      // these assert the HTTP/1 proxy path, where the force-proxy redirect applies
      _forceProxyMiddleware(route, namespace, () => false)(req, res, next)

      return { res, next }
    }

    const nonProxied = (proxiedUrl: string, headers = {}) => ({ proxiedUrl, headers })

    it('lets a non-proxied graphql request through when the session id header matches', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }))

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.redirect).not.toHaveBeenCalled()
    })

    it('redirects a non-proxied graphql request whose session id header is missing', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs'))

      expect(res.redirect).toHaveBeenCalledWith(clientRoute)
      expect(next).not.toHaveBeenCalled()
    })

    it('redirects when the session id header does not match the current session', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'nope' }))

      expect(res.redirect).toHaveBeenCalledWith(clientRoute)
      expect(next).not.toHaveBeenCalled()
    })

    it('redirects when the session id header is duplicated (array-valued)', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': ['abc', 'abc'] }))

      expect(res.redirect).toHaveBeenCalledWith(clientRoute)
      expect(next).not.toHaveBeenCalled()
    })

    it('redirects a graphql request when no session is running', () => {
      getCurrent.mockReturnValue(null)

      const { res, next } = run(nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }))

      expect(res.redirect).toHaveBeenCalledWith(clientRoute)
      expect(next).not.toHaveBeenCalled()
    })

    it('lets a proxied graphql request through without a session id header', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run({ proxiedUrl: 'http://localhost:2020/__cypress/tap/graphql/TapSpecs', headers: {} })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.redirect).not.toHaveBeenCalled()
    })

    // packages/app's Cypress-in-Cypress config overrides `namespace` this way.
    it('lets a tap request through when the project overrides the namespace', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(
        nonProxied('/__cypress/tap/graphql/TapSpecs', { 'x-cypress-session-id': 'abc' }),
        { clientRoute: '/__app/', namespace: '__cypress-app' },
      )

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.redirect).not.toHaveBeenCalled()
    })

    it('still lets the read-only sessions probe bypass without a header', () => {
      getCurrent.mockReturnValue({ sessionId: 'abc' })

      const { res, next } = run(nonProxied('/__cypress/sessions/whatever'))

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.redirect).not.toHaveBeenCalled()
    })
  })

  describe('#onConnect', () => {
    const FORBIDDEN = 'HTTP/1.1 403 Forbidden\r\n\r\nProxy is disabled\r\n'
    const BAD_GATEWAY = 'HTTP/1.1 502 Bad Gateway\r\n\r\nProxy is not ready\r\n'

    let connectSocket: { write: Mock, end: Mock, once: Mock }
    let ensureHttpsProxy: Mock

    beforeEach(() => {
      server._openConfig = config
      connectSocket = {
        write: vi.fn(),
        end: vi.fn(),
        once: vi.fn(),
      }

      ensureHttpsProxy = vi.spyOn(server, 'ensureHttpsProxy').mockResolvedValue(undefined) as unknown as Mock
    })

    // A leftover browser on this port, or a machine-level system proxy, can
    // CONNECT before any launch resolves the path. Tunneling it would also
    // generate a root CA a CDP-destined run never needs.
    it('responds 403 before a launch has claimed the proxy', async () => {
      await server.onConnect({ url: 'example.com:443' }, connectSocket, null)

      expect(connectSocket.write).toHaveBeenCalledWith(FORBIDDEN)
      expect(connectSocket.end).toHaveBeenCalled()
      expect(ensureHttpsProxy).not.toHaveBeenCalled()
    })

    it('responds 403 on the browser (CDP) network path', async () => {
      await enterBrowserNetworkMode(server)

      await server.onConnect({ url: 'example.com:443' }, connectSocket, null)

      expect(connectSocket.write).toHaveBeenCalledWith(FORBIDDEN)
      expect(connectSocket.end).toHaveBeenCalled()
    })

    // Creation can fail (root CA write, SNI bind); a CONNECT retries it and
    // answers 502 rather than tearing the socket down on an unhandled rejection.
    it('responds 502 on the MITM path when the https proxy could not be created', async () => {
      await server.setNetworkMode(false)

      ensureHttpsProxy.mockRejectedValue(new Error('EACCES: cannot write the root CA'))

      expect(server._httpsProxy).toBeUndefined()

      await server.onConnect({ url: 'example.com:443' }, connectSocket, null)

      expect(connectSocket.write).toHaveBeenCalledWith(BAD_GATEWAY)
      expect(connectSocket.end).toHaveBeenCalled()
    })

    it('hands the CONNECT to the https proxy once it is up', async () => {
      const httpsConnect = vi.fn()

      server._httpsProxy = { connect: httpsConnect, close: vi.fn() }

      await server.setNetworkMode(false)
      await server.onConnect({ url: 'example.com:443' }, connectSocket, null)

      expect(httpsConnect).toHaveBeenCalled()
      expect(connectSocket.write).not.toHaveBeenCalled()
    })
  })
})
