import { deepStrictEqual } from 'assert'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { NetworkProxy } from '@packages/proxy'
import { netStubbingState } from '@packages/net-stubbing'
import { NetworkInterceptionCore } from '@packages/network-interception'
import type { Protocol } from 'devtools-protocol'
import { CdpFetchTransport } from '../../lib/browsers/cdp-protocol/cdp-fetch-transport'
import { createCdpFetchRuntime, createProxyRuntime } from '../../lib/network-runtime'

const callsMatching = (mock: Mock, expected: unknown[]) => {
  return mock.mock.calls.filter((call) => {
    try {
      deepStrictEqual(call.slice(0, expected.length), expected)

      return true
    } catch {
      return false
    }
  })
}

// sinon's calledWith matches a prefix of the recorded arguments, where vitest's
// toHaveBeenCalledWith requires the exact arity
const expectCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).not.toHaveLength(0)
}

const expectNotCalledWith = (mock: Mock, ...expected: unknown[]) => {
  expect(callsMatching(mock, expected), `calls matching ${String(expected[0])}`).toHaveLength(0)
}

const findCall = (mock: Mock, method: string) => {
  return mock.mock.calls.find((args) => args[0] === method)
}

const pausedHandlerCalls = (on: Mock) => {
  return on.mock.calls.filter((args) => args[0] === 'Fetch.requestPaused')
}

const callOrders = (mock: Mock, method: string) => {
  return mock.mock.calls.flatMap((args, i) => (args[0] === method ? [mock.mock.invocationCallOrder[i]] : []))
}

const firstCallOrder = (mock: Mock, method: string) => callOrders(mock, method)[0]

const lastCallOrder = (mock: Mock, method: string) => callOrders(mock, method).at(-1)

// send() resolves {} for every method except the overridden ones
const sendAnswering = (overrides: Record<string, () => Promise<unknown>>) => {
  return (method: string) => overrides[method]?.() ?? Promise.resolve({})
}

describe('lib/network-runtime', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const baseDeps = () => {
    return {
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
      } as Cypress.Config,
      remoteStates: {
        hasPrimary: vi.fn().mockReturnValue(false),
        getPrimary: vi.fn().mockReturnValue({ origin: 'https://example.test', strategy: 'http', props: {} }),
        get: vi.fn().mockReturnValue(undefined),
        current: vi.fn().mockReturnValue({ origin: 'https://example.test', strategy: 'http', props: {} }),
        isPrimarySuperDomainBasedOrigin: vi.fn().mockReturnValue(false),
        isPrimarySuperDomainOrigin: vi.fn().mockReturnValue(false),
        getByStrategy: vi.fn(),
        reset: vi.fn(),
      } as any,
      getFileServerToken: () => 'token',
      getCookieJar: () => {
        return {
          getCookies: vi.fn().mockReturnValue([]),
        } as any
      },
      socket: {
        toDriver: vi.fn(),
      } as any,
      request: {
        rp: vi.fn(),
      } as any,
      serverBus: { emit: vi.fn() } as any,
      getCurrentBrowser: () => ({}) as any,
      // required for both runtimes: the state is created at server open and every
      // runtime has to share it
      netStubbingState: netStubbingState(),
    }
  }

  function createPausedRequest (options: {
    requestId: string
    networkId?: string
    url?: string
    resourceType?: Protocol.Network.ResourceType
    requestHeaders?: Record<string, string>
    responseStatusCode?: number
    responseHeaders?: Protocol.Fetch.HeaderEntry[]
  }): Protocol.Fetch.RequestPausedEvent {
    return {
      requestId: options.requestId,
      networkId: options.networkId,
      frameId: 'frame-1',
      resourceType: options.resourceType ?? 'Document',
      request: {
        url: options.url ?? 'https://example.test/',
        method: 'GET',
        headers: options.requestHeaders ?? {},
      },
      responseStatusCode: options.responseStatusCode,
      responseHeaders: options.responseHeaders,
    } as Protocol.Fetch.RequestPausedEvent
  }

  async function startCdpRuntime (runtime: ReturnType<typeof createCdpFetchRuntime>, client: { send: Mock, on: Mock }) {
    await runtime.start()
    client.send.mockClear()

    return (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => {
      return Promise.all(pausedHandlerCalls(client.on).map((call) => {
        const handler = call[1] as (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => void

        return handler(event, sessionId)
      }))
    }
  }

  async function tick () {
    await Promise.resolve()
  }

  async function flush () {
    // Legacy middleware runs several async Bluebird stages before the transport
    // continues the CDP request; flush a handful of microtasks/macrotasks.
    for (let i = 0; i < 10; i++) {
      await tick()
    }

    await new Promise((resolve) => setImmediate(resolve))
  }

  // withBody: true answers Fetch.getResponseBody with an empty body, for
  // tests that assert whether it was called; plain clients just resolve
  // every send() with {}.
  function createCdpClient (options: { withBody?: boolean } = {}) {
    const send = options.withBody
      ? vi.fn(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      })
      : vi.fn().mockResolvedValue({})

    return { send, on: vi.fn(), off: vi.fn() }
  }

  // Drives the paired request-stage/response-stage Fetch.requestPaused pauses
  // shared by the classification tests below, flushing the legacy
  // middleware's async stages between and after each one.
  async function drivePausedRequest (
    onPaused: (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => Promise<unknown>,
    options: Parameters<typeof createPausedRequest>[0],
  ) {
    const { responseStatusCode, responseHeaders, ...requestOptions } = options
    const handled = onPaused(createPausedRequest(requestOptions))

    await flush()

    await onPaused(createPausedRequest({ ...requestOptions, responseStatusCode, responseHeaders }))

    await flush()
    await handled
  }

  // Same "replay every registered Fetch.requestPaused handler" shape as
  // startCdpRuntime's returned function, for a client not started via it
  // (e.g. an extra-target client whose handlers register through attachExtraTarget).
  function wirePausedHandler (client: { on: Mock }) {
    return (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => {
      return Promise.all(pausedHandlerCalls(client.on).map((call) => {
        return (call[1] as (event: Protocol.Fetch.RequestPausedEvent, sessionId?: string) => void)(event, sessionId)
      }))
    }
  }

  // hasInterceptor: false keeps net-stubbing's before:request subscription
  // fire-and-forget (planSubscriptions awaits it only for a route with a live
  // driver-side handler) — exercising the driver round trip is out of scope
  // for these classification tests, and awaiting it here would hang forever
  // since there is no driver to answer.
  const minimalMatchingRoute = (id: string) => {
    return {
      id,
      routeMatcher: { url: '*' },
      hasInterceptor: false,
      getFixture: vi.fn(),
      matches: 0,
    } as any
  }

  it('createProxyRuntime constructs networkProxy and reuses the provided netStubbingState', () => {
    const deps = baseDeps()
    const runtime = createProxyRuntime(deps)

    expect(runtime.networkProxy).toBeInstanceOf(NetworkProxy)
    expect(runtime.netStubbingState).toBe(deps.netStubbingState)
    expect(runtime.networkProxy.http.netStubbingState).toBe(deps.netStubbingState)
  })

  // See disable-navigation-preload.ts (#34652) for the mechanism; only the
  // CDP Fetch runtime sets this flag. Explicitly false, not merely absent -
  // ServerCtx.useBrowserNetworkInterception is a general discriminator other
  // consumers may branch on, so this path must say what it is, not leave it
  // undefined.
  it('createProxyRuntime does not disable service worker navigation preload', () => {
    const runtime = createProxyRuntime(baseDeps())

    expect(runtime.networkProxy.http.useBrowserNetworkInterception).toBe(false)
  })

  it('createCdpFetchRuntime disables service worker navigation preload on its NetworkProxy', () => {
    const client = {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    expect(runtime.networkProxy.http.useBrowserNetworkInterception).toBe(true)
  })

  it('registers default configurator network policies at startup', () => {
    const runtime = createProxyRuntime({
      ...baseDeps(),
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        blockHosts: ['localhost:3131'],
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies).toHaveLength(3)
    expect(policies[0].name).toBe('blocked-hosts')
    expect(policies[0].when({ url: 'http://localhost:3131/' })).toBe(true)
    expect(runtime.networkInterceptionCore).toBeInstanceOf(NetworkInterceptionCore)
  })

  it('registers configurator CSP and document rewrite policies at startup', () => {
    const runtime = createProxyRuntime({
      ...baseDeps(),
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        experimentalCspAllowList: ['script-src'],
        modifyObstructiveCode: true,
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies.map((p) => p.name)).toEqual(expect.arrayContaining([
      'blocked-hosts',
      'csp-allow-list',
      'document-rewrite',
    ]))
  })

  it('handleHttpRequest delegates to networkProxy.handleHttpRequest', async () => {
    const runtime = createProxyRuntime(baseDeps())
    const req = { proxiedUrl: 'http://example.com/' }
    const res = {}
    const stub = vi.spyOn(runtime.networkProxy, 'handleHttpRequest').mockResolvedValue(undefined)

    await runtime.handleHttpRequest(req, res)

    expect(stub).toHaveBeenCalledOnce()
    expect(stub).toHaveBeenCalledWith(req, res)
  })

  it('setProtocolManager delegates to networkProxy', () => {
    const runtime = createProxyRuntime(baseDeps())
    const spy = vi.spyOn(runtime.networkProxy, 'setProtocolManager')
    const pm = {} as any

    runtime.setProtocolManager(pm)

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(pm)
  })

  it('reset and clearCredentials delegate to networkProxy', () => {
    const runtime = createProxyRuntime(baseDeps())
    const resetSpy = vi.spyOn(runtime.networkProxy, 'reset')
    const clearSpy = vi.spyOn(runtime.networkProxy, 'clearCredentials')

    runtime.reset({ resetBetweenSpecs: true })
    runtime.clearCredentials()

    expect(resetSpy).toHaveBeenCalledOnce()
    expect(resetSpy).toHaveBeenCalledWith({ resetBetweenSpecs: true })
    expect(clearSpy).toHaveBeenCalledOnce()
  })

  it('addBrowserPreRequest delegates to networkProxy.addPendingBrowserPreRequest', async () => {
    const runtime = createProxyRuntime(baseDeps())
    const spy = vi.spyOn(runtime.networkProxy, 'addPendingBrowserPreRequest')
    const preRequest = { requestId: '1', url: 'http://example.com' } as any

    await runtime.addBrowserPreRequest(preRequest)

    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(preRequest)
  })

  it('createCdpFetchRuntime wires CDP Fetch with the legacy proxy pipeline', () => {
    const client = {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
    const isAUTFrame = vi.fn().mockResolvedValue(true)
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      isAUTFrame,
    })

    expect(runtime.networkProxy).toBeInstanceOf(NetworkProxy)
    expect(runtime.netStubbingState.routes).toStrictEqual([])
    expect(runtime.networkInterception).toBeDefined()
    expect(runtime.networkInterceptionCore).toBeInstanceOf(NetworkInterceptionCore)
    expect(runtime.networkPolicyRegistration).toBeDefined()
    expect(runtime.fetchTransport).toBeDefined()
    // Express handleHttpRequest uses a proxy-codec intercept; CDP traffic uses a distinct one.
    expect(runtime.networkProxy.http.networkInterception).toBeDefined()
    expect(runtime.networkProxy.http.networkInterception).not.toBe(runtime.networkInterception)

    const policies = runtime.networkPolicyRegistration.getPolicies()

    expect(policies.map((p) => p.name)).toEqual(expect.arrayContaining([
      'blocked-hosts',
      'csp-allow-list',
      'document-rewrite',
    ]))
  })

  it('createCdpFetchRuntime routes handleHttpRequest through the Express intercept', async () => {
    const client = {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
    })
    const expressIntercept = runtime.networkProxy.http.networkInterception!
    const handleStub = vi.spyOn(expressIntercept, 'handle').mockResolvedValue({} as any)
    const req = { proxiedUrl: 'http://example.com/', get: vi.fn() } as any
    const res = {} as any

    await runtime.networkProxy.handleHttpRequest(req, res)

    expect(handleStub).toHaveBeenCalledOnce()
    expect(handleStub.mock.calls[0][0].req).toBe(req)
    expect(handleStub.mock.calls[0][0].res).toBe(res)
  })

  it('createCdpFetchRuntime reuses a provided netStubbingState', () => {
    const client = {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
    const existingState = {
      routes: [{ id: 'existing-route' }],
      requests: {},
      reset: vi.fn(),
    } as any
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      netStubbingState: existingState,
    })

    expect(runtime.netStubbingState).toBe(existingState)
    expect(runtime.networkProxy.http.netStubbingState).toBe(existingState)
  })

  it('createCdpFetchRuntime registers blocked-hosts policy for the browser (CDP) network path', () => {
    const client = {
      send: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        blockHosts: ['blocked.example.test'],
      } as Cypress.Config,
    })

    const policies = runtime.networkPolicyRegistration.getPolicies()
    const blockedHosts = policies.find((p) => p.name === 'blocked-hosts')

    expect(blockedHosts).toBeDefined()
    expect(blockedHosts!.when({ url: 'http://blocked.example.test/' })).toBe(true)
    expect(blockedHosts!.when({ url: 'http://allowed.example.test/' })).toBe(false)
  })

  it('createCdpFetchRuntime reset clears transport state without resetting NetworkProxy or disabling Fetch', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const networkProxyReset = vi.spyOn(runtime.networkProxy, 'reset')
    const transportReset = vi.spyOn(runtime.fetchTransport, 'reset')

    await runtime.start()
    client.send.mockClear()

    runtime.reset()

    // server-base owns networkProxy.reset; runtime.reset is transport-only
    expect(networkProxyReset).not.toHaveBeenCalled()
    expect(transportReset).toHaveBeenCalledOnce()
    expectNotCalledWith(client.send, 'Fetch.disable')

    await runtime.stop()

    expectCalledWith(client.send, 'Fetch.disable')
  })

  it('createCdpFetchRuntime records the AUT URL when the automation layer reports an AUT navigation commit', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    let notifyAUTFrameNavigated!: (url: string) => void
    const unsubscribe = vi.fn()
    const onAUTFrameNavigated = vi.fn((listener: (url: string) => void) => {
      notifyAUTFrameNavigated = listener

      return unsubscribe
    })
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      onAUTFrameNavigated,
    })

    await runtime.start()

    const setAUTUrl = vi.spyOn(runtime.networkProxy.http, 'setAUTUrl')

    // test isolation blanks the AUT frame between tests; about:blank must
    // never become the simulated top
    notifyAUTFrameNavigated('about:blank')
    notifyAUTFrameNavigated('data:text/html,<p>hi</p>')
    notifyAUTFrameNavigated('https://app.test/dashboard')

    expect(setAUTUrl).toHaveBeenCalledOnce()
    expect(setAUTUrl).toHaveBeenCalledWith('https://app.test/dashboard')

    await runtime.stop()

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('createCdpFetchRuntime unsubscribes from AUT navigation commits when Fetch.enable fails', async () => {
    const client = {
      send: vi.fn().mockRejectedValue(new Error('enable failed')),
      on: vi.fn(),
      off: vi.fn(),
    }
    const unsubscribe = vi.fn()
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      onAUTFrameNavigated: vi.fn().mockReturnValue(unsubscribe),
    })

    await expect(runtime.start()).rejects.toThrow('enable failed')

    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('createCdpFetchRuntime starts Fetch interception and continues requests by default', async () => {
    const client = {
      send: vi.fn(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    const handled = onRequestPaused(createPausedRequest({
      requestId: 'fetch-request',
      networkId: 'network-1',
    }))

    await flush()

    // Legacy request middleware may mutate headers (e.g. accept-encoding) before continue.
    const continueCall = findCall(client.send, 'Fetch.continueRequest')

    expect(continueCall, 'expected Fetch.continueRequest').toBeDefined()
    expect(continueCall![1]).toMatchObject({ requestId: 'fetch-request' })

    await onRequestPaused(createPausedRequest({
      requestId: 'fetch-request',
      networkId: 'network-1',
      responseStatusCode: 200,
    }))

    await flush()
    await handled

    const continueResponseCall = findCall(client.send, 'Fetch.continueResponse')
    const fulfillCall = findCall(client.send, 'Fetch.fulfillRequest')

    expect(continueResponseCall, 'expected Fetch.continueResponse for unmodified response').toBeDefined()
    expect(continueResponseCall![1]).toMatchObject({
      requestId: 'fetch-request',
      responseCode: 200,
    })

    expect(fulfillCall, 'expected no Fetch.fulfillRequest for unmodified response').toBeUndefined()
  })

  // The legacy pipeline hands every response body back through the synthetic
  // Express context, so an asset it does not rewrite has to come out
  // byte-identical for the transport to release the origin response.
  it('createCdpFetchRuntime continues asset responses the legacy pipeline leaves byte-identical', async () => {
    const assetBody = Buffer.from('body { color: red; }')
    const client = {
      send: vi.fn(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: assetBody.toString('base64'), base64Encoded: true }
        }

        return {}
      }),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const onRequestPaused = await startCdpRuntime(runtime, client)
    const pause = {
      requestId: 'asset-request',
      networkId: 'network-asset-1',
      url: 'https://example.test/app.css',
      resourceType: 'Stylesheet' as Protocol.Network.ResourceType,
    }

    const handled = onRequestPaused(createPausedRequest(pause))

    await flush()

    await onRequestPaused(createPausedRequest({
      ...pause,
      responseStatusCode: 200,
      responseHeaders: [{
        name: 'content-type',
        value: 'text/css',
      }, {
        name: 'content-length',
        value: String(assetBody.length),
      }],
    }))

    await flush()
    await handled

    const continueResponseCall = findCall(client.send, 'Fetch.continueResponse')
    const fulfillCall = findCall(client.send, 'Fetch.fulfillRequest')

    expect(continueResponseCall, 'expected Fetch.continueResponse for an unrewritten asset').toBeDefined()
    expect(continueResponseCall![1]).toMatchObject({
      requestId: 'asset-request',
      responseCode: 200,
    })

    // The pipeline left the headers alone, so the origin's own content-length
    // survives by omitting responseHeaders rather than resending a copy of it.
    expect(continueResponseCall![1]).not.toHaveProperty('responseHeaders')

    expect(fulfillCall, 'expected no Fetch.fulfillRequest for an unrewritten asset').toBeUndefined()
  })

  it('createCdpFetchRuntime propagates CDP XHR resourceType onto the synthetic Express request', async () => {
    const client = {
      send: vi.fn(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      client,
      // Exercise the correlation fallback path: no pre-request arrives, so the
      // transport-normalized resourceType must survive onto req.
      shouldCorrelatePreRequests: () => true,
    })
    const seenResourceTypes: Array<string | undefined> = []

    // Registered after the legacy pipeline (which runs CorrelateBrowserPreRequest),
    // so this observes req.resourceType post-fallback rather than pre-middleware.
    runtime.networkInterception.use((req, next) => {
      seenResourceTypes.push(req.resourceType)

      return next(req)
    })

    // Resolve correlation immediately with no browserPreRequest so the
    // transport value is the only source of resourceType.
    vi.spyOn(runtime.networkProxy.http.preRequests, 'get').mockImplementation((_req, _debug, cb) => {
      cb({ browserPreRequest: undefined })

      return undefined
    })

    const onRequestPaused = await startCdpRuntime(runtime, client)
    const handled = onRequestPaused(createPausedRequest({
      requestId: 'fetch-xhr',
      networkId: 'network-xhr',
      resourceType: 'XHR',
    }))

    await flush()

    await onRequestPaused(createPausedRequest({
      requestId: 'fetch-xhr',
      networkId: 'network-xhr',
      resourceType: 'XHR',
      responseStatusCode: 200,
    }))

    await flush()
    await handled

    expect(seenResourceTypes).toContain('xhr')
  })

  it('createCdpFetchRuntime redirects strategy:file URLs to the Cypress origin with loopback headers', async () => {
    const client = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const deps = baseDeps()

    deps.config = { ...deps.config, port: 2020 } as Cypress.Config

    deps.remoteStates.current = vi.fn().mockReturnValue({
      origin: 'http://localhost:2020',
      strategy: 'file',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    })

    deps.request = {
      rp: vi.fn(),
      create: vi.fn(),
    } as any

    const runtime = createCdpFetchRuntime({ ...deps, client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await onRequestPaused(createPausedRequest({
      requestId: 'file-request',
      networkId: 'network-file-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
    }))

    await flush()

    // No Node-side file-server fetch — the request stays on the wire and the
    // Express direct-origin catch-all serves it.
    expect(deps.request.create).not.toHaveBeenCalled()

    const continueCall = findCall(client.send, 'Fetch.continueRequest')
    const fulfillCall = findCall(client.send, 'Fetch.fulfillRequest')

    expect(continueCall, 'expected Fetch.continueRequest').toBeDefined()
    expect(fulfillCall, 'expected no Fetch.fulfillRequest').toBeUndefined()

    // Page-invisible url override to our origin; loopback headers carry the
    // impersonated URL so setProxiedUrl restores it Express-side.
    const continueParams = continueCall![1]

    expect(continueParams.requestId).toBe('file-request')
    expect(continueParams.url).toBe('http://localhost:2020/cypress/fixtures/records.csv')

    const headerNames = continueParams.headers.map((h: { name: string }) => h.name)

    expect(headerNames).toContain('x-cypress-internal-loopback')
    expect(headerNames).toContain('x-cypress-internal-loopback-token')
    expect(continueParams.headers.find((h: { name: string }) => h.name === 'x-cypress-internal-loopback').value)
    .toBe('http://localhost:2020/cypress/fixtures/records.csv')

    // The response pause for a passed-through request is released untouched.
    await onRequestPaused(createPausedRequest({
      requestId: 'file-request',
      networkId: 'network-file-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
      responseStatusCode: 200,
    }))

    await flush()

    const continueResponseCall = findCall(client.send, 'Fetch.continueResponse')

    expect(continueResponseCall, 'expected Fetch.continueResponse').toBeDefined()
    expect(continueResponseCall![1]).toStrictEqual({ requestId: 'file-request' })
  })

  it('createCdpFetchRuntime releases the pause untouched when the origin-redirect continueRequest is rejected', async () => {
    const client = {
      send: vi.fn(async (method: string, params: any) => {
        // reject the full-args override, accept the bare release
        if (method === 'Fetch.continueRequest' && params?.url) {
          throw new Error('Invalid http header value')
        }

        return {}
      }),
      on: vi.fn(),
      off: vi.fn(),
    }
    const deps = baseDeps()

    deps.config = { ...deps.config, port: 2020 } as Cypress.Config

    deps.remoteStates.current = vi.fn().mockReturnValue({
      origin: 'http://localhost:2020',
      strategy: 'file',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    })

    const runtime = createCdpFetchRuntime({ ...deps, client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await onRequestPaused(createPausedRequest({
      requestId: 'file-request',
      networkId: 'network-file-1',
      url: 'http://localhost:2020/cypress/fixtures/records.csv',
    }))

    await flush()

    const continueCalls = client.send.mock.calls.filter((args) => args[0] === 'Fetch.continueRequest')

    expect(continueCalls, 'override attempt plus bare fallback').toHaveLength(2)
    expect(continueCalls[0][1].url).toBeDefined()
    expect(continueCalls[1][1]).toStrictEqual({ requestId: 'file-request' })
  })

  it('createCdpFetchRuntime passes download pauses without networkId through without waiting for pre-request timeout', { timeout: 5000 }, async () => {
    vi.useFakeTimers({
      toFake: ['setTimeout', 'clearTimeout'],
    })

    try {
      const client = {
        send: vi.fn().mockResolvedValue({}),
        on: vi.fn(),
        off: vi.fn(),
      }
      const deps = baseDeps()
      const fileBody = Buffer.from('"Joe","Smith"')
      const downloadUrl = 'http://localhost:2020/cypress/fixtures/records.csv'

      deps.config = { ...deps.config, port: 2020 } as Cypress.Config

      deps.remoteStates.current = vi.fn().mockReturnValue({
        origin: 'http://localhost:2020',
        strategy: 'file',
        fileServer: 'http://localhost:2021',
        domainName: 'localhost',
        props: null,
      })

      deps.request = {
        rp: vi.fn(),
        create: vi.fn().mockResolvedValue({
          statusCode: 200,
          headers: {
            'content-type': 'text/csv',
            'content-disposition': 'attachment; filename="records.csv"',
          },
          body: fileBody,
        }),
      } as any

      const runtime = createCdpFetchRuntime({
        ...deps,
        client,
        shouldCorrelatePreRequests: () => true,
      })
      const addPendingSpy = vi.spyOn(runtime.networkProxy, 'addPendingUrlWithoutPreRequest')
      const onRequestPaused = await startCdpRuntime(runtime, client)

      // Downloads omit networkId — without pre-registration the Express-side
      // CorrelateBrowserPreRequest would wait the default 2000ms pre-request timeout.
      const handled = onRequestPaused(createPausedRequest({
        requestId: 'download-file-request',
        url: downloadUrl,
      }))

      await flush()
      await vi.advanceTimersByTimeAsync(0)
      await flush()

      // Pre-registration still happens for pass-through pauses so the
      // Express-side CorrelateBrowserPreRequest resolves immediately.
      expect(addPendingSpy).toHaveBeenCalledOnce()
      expect(addPendingSpy).toHaveBeenCalledWith(downloadUrl)
      expect(deps.request.create).not.toHaveBeenCalled()

      const continueCall = findCall(client.send, 'Fetch.continueRequest')

      expect(continueCall, 'expected Fetch.continueRequest before pre-request timeout').toBeDefined()
      expect(continueCall![1].requestId).toBe('download-file-request')
      expect(continueCall![1].url).toBe(downloadUrl)

      await handled
    } finally {
      vi.useRealTimers()
    }
  })

  it('createCdpFetchRuntime continues http-strategy requests without hitting the file server', async () => {
    const client = {
      send: vi.fn(async (method: string) => {
        if (method === 'Fetch.getResponseBody') {
          return { body: '', base64Encoded: false }
        }

        return {}
      }),
      on: vi.fn(),
      off: vi.fn(),
    }
    const deps = baseDeps()

    deps.request = {
      rp: vi.fn(),
      create: vi.fn().mockResolvedValue({
        statusCode: 200,
        headers: {},
        body: 'should-not-be-used',
      }),
    } as any

    const runtime = createCdpFetchRuntime({ ...deps, client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    const handled = onRequestPaused(createPausedRequest({
      requestId: 'http-request',
      networkId: 'network-http-1',
      url: 'https://example.test/app',
    }))

    await flush()

    expect(deps.request.create).not.toHaveBeenCalled()

    const continueCall = findCall(client.send, 'Fetch.continueRequest')

    expect(continueCall, 'expected Fetch.continueRequest').toBeDefined()

    await onRequestPaused(createPausedRequest({
      requestId: 'http-request',
      networkId: 'network-http-1',
      url: 'https://example.test/app',
      responseStatusCode: 200,
    }))

    await flush()
    await handled

    const continueResponseCall = findCall(client.send, 'Fetch.continueResponse')
    const fulfillCall = findCall(client.send, 'Fetch.fulfillRequest')

    expect(continueResponseCall, 'expected Fetch.continueResponse for http-strategy response').toBeDefined()
    expect(continueResponseCall![1]).toMatchObject({
      requestId: 'http-request',
      responseCode: 200,
    })

    expect(fulfillCall, 'expected no Fetch.fulfillRequest for http-strategy response').toBeUndefined()
  })

  it('createCdpFetchRuntime attachExtraTarget transports redirect strategy:file URLs like the main transport', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const deps = baseDeps()

    deps.config = { ...deps.config, port: 2020 } as Cypress.Config

    deps.remoteStates.current = vi.fn().mockReturnValue({
      origin: 'http://localhost:2020',
      strategy: 'file',
      fileServer: 'http://localhost:2021',
      domainName: 'localhost',
      props: null,
    })

    const runtime = createCdpFetchRuntime({ ...deps, client: mainClient })

    await runtime.start()
    await runtime.attachExtraTarget(extraClient)

    const onRequestPaused = (event: Protocol.Fetch.RequestPausedEvent) => {
      return Promise.all(pausedHandlerCalls(extraClient.on).map((call) => {
        return (call[1] as (event: Protocol.Fetch.RequestPausedEvent) => void)(event)
      }))
    }

    await onRequestPaused(createPausedRequest({
      requestId: 'popup-file-request',
      networkId: 'network-popup-1',
      url: 'http://localhost:2020/cypress/fixtures/popup.html',
    }))

    await flush()

    // Popup file traffic reaches Express either way — released untouched so
    // the pipeline runs once there, not on the CDP side first.
    const continueCall = findCall(extraClient.send, 'Fetch.continueRequest')

    expect(continueCall, 'expected Fetch.continueRequest').toBeDefined()
    expect(continueCall![1].url).toBe('http://localhost:2020/cypress/fixtures/popup.html')
    expect(continueCall![1].headers.map((h: { name: string }) => h.name))
    .toContain('x-cypress-internal-loopback-token')

    await runtime.stop()
  })

  it('createCdpFetchRuntime attachExtraTarget starts a transport that shares the main intercept', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()

    const detach = await runtime.attachExtraTarget(extraClient)

    expectCalledWith(extraClient.send, 'Network.enable')
    expectCalledWith(extraClient.send, 'Fetch.enable', {
      patterns: [{
        requestStage: 'Request',
      }, {
        requestStage: 'Response',
      }],
    })

    expectCalledWith(extraClient.on, 'Fetch.requestPaused')
    expect(firstCallOrder(extraClient.send, 'Fetch.enable')).toBeLessThan(lastCallOrder(extraClient.send, 'Network.enable'))

    const transportReset = vi.spyOn(CdpFetchTransport.prototype, 'reset')

    runtime.reset()

    // Asserts the extra transport itself reset, not just that reset() fired
    // twice — a call count alone would also pass if the main transport's
    // reset ran twice and the extra transport's never ran.
    expect(transportReset).toHaveBeenCalledTimes(2)
    expect(transportReset.mock.contexts).toContain(runtime.fetchTransport)
    expect(transportReset.mock.contexts.filter((transport) => transport !== runtime.fetchTransport)).toHaveLength(1)

    await detach()

    expectCalledWith(extraClient.send, 'Fetch.disable')

    await runtime.stop()
  })

  it('createCdpFetchRuntime attachExtraTarget attaches even when Network.enable never settles on the paused target', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    // models the auto-attached debugger-paused target: Network.enable's
    // response never arrives because the renderer only unpauses after
    // attachExtraTarget returns (#34512)
    extraClient.send.mockImplementation(sendAnswering({ 'Network.enable': () => new Promise(() => {}) }))

    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()

    const detach = await runtime.attachExtraTarget(extraClient)

    expect(detach).toBeTypeOf('function')
    expectCalledWith(extraClient.send, 'Fetch.enable', {
      patterns: [{
        requestStage: 'Request',
      }, {
        requestStage: 'Response',
      }],
    })

    // The enable was still attempted, even though it never settles while
    // paused — a future change should not be able to silently drop it.
    expectCalledWith(extraClient.send, 'Network.enable')

    expectCalledWith(extraClient.on, 'Fetch.requestPaused')

    await runtime.stop()
  })

  it('createCdpFetchRuntime attachExtraTarget does not surface an unhandled rejection when Network.enable fails', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    extraClient.send.mockImplementation(sendAnswering({ 'Network.enable': () => Promise.reject(new Error('WebSocket connection closed')) }))

    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })
    const unhandled = vi.fn()

    await runtime.start()

    process.on('unhandledRejection', unhandled)

    try {
      await runtime.attachExtraTarget(extraClient)

      await flush()

      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.removeListener('unhandledRejection', unhandled)
    }

    await runtime.stop()
  })

  it('createCdpFetchRuntime enables Fetch on service worker sessions that attach to the page connection', async () => {
    const client: {
      send: Mock
      on: Mock
      off: Mock
      onChildTargetAttached?: (sessionId: string) => Promise<void>
    } = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    expect(client.onChildTargetAttached, 'hook is not registered before start').toBeUndefined()

    await runtime.start()
    client.send.mockClear()

    await client.onChildTargetAttached!('sw-session')

    // A service worker's script fetch and fetch-handler requests run on its own
    // session, so they only reach the middleware onion (and cy.intercept) if
    // Fetch is enabled there too.
    expectCalledWith(client.send, 'Fetch.enable', {
      patterns: [{
        requestStage: 'Request',
      }, {
        requestStage: 'Response',
      }],
    }, 'sw-session')

    await runtime.stop()

    // The page client outlives the runtime, so a stale hook would enable Fetch
    // against a transport that has already dropped its handlers.
    expect(client.onChildTargetAttached, 'hook is cleared on stop').toBeUndefined()
  })

  it('createCdpFetchRuntime clears the service worker hook when Fetch.enable fails', async () => {
    const client: {
      send: Mock
      on: Mock
      off: Mock
      onChildTargetAttached?: (sessionId: string) => Promise<void>
    } = {
      send: vi.fn().mockRejectedValue(new Error('enable failed')),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    await expect(runtime.start()).rejects.toThrow('enable failed')

    expect(client.onChildTargetAttached).toBeUndefined()
  })

  it('createCdpFetchRuntime stop also stops attached extra-target transports', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()
    await runtime.attachExtraTarget(extraClient)
    await runtime.stop()

    expectCalledWith(extraClient.send, 'Fetch.disable')
    expectCalledWith(mainClient.send, 'Fetch.disable')
  })

  it('createCdpFetchRuntime stop does not hang on an extra-target transport that never answers Fetch.disable', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    // models an extra target whose own CDP connection is already gone —
    // Fetch.disable is sent but never answered
    extraClient.send.mockImplementation(sendAnswering({ 'Fetch.disable': () => new Promise(() => {}) }))

    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()
    await runtime.attachExtraTarget(extraClient)
    await runtime.stop()

    expectCalledWith(extraClient.send, 'Fetch.disable')
    expectCalledWith(mainClient.send, 'Fetch.disable')
  })

  it('createCdpFetchRuntime attachExtraTarget rejects promptly when stop() lands mid-attach', async () => {
    const mainClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }
    const extraClient = {
      send: vi.fn().mockResolvedValue({}),
      on: vi.fn(),
      off: vi.fn(),
    }

    // park attachExtraTarget inside extraTransport.start() until we release it
    const fetchEnableGate = Promise.withResolvers<void>()

    // models a dead-but-open extra-target socket — Fetch.disable is sent but
    // never answered, same as the sibling stop()/detach paths
    extraClient.send.mockImplementation(sendAnswering({
      'Fetch.enable': () => fetchEnableGate.promise,
      'Fetch.disable': () => new Promise(() => {}),
    }))

    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()

    const attach = runtime.attachExtraTarget(extraClient)

    await flush()

    // stop() lands while attach is still awaiting Fetch.enable inside start()
    await runtime.stop()

    fetchEnableGate.resolve()

    await expect(attach).rejects.toThrow('CDP Fetch runtime has been stopped')
    expectCalledWith(extraClient.send, 'Fetch.disable')
  })

  // `times` exhaustion disables a route once request-stage counting reaches
  // the limit — but that counting happens on the very request that trips it,
  // so that request's own response must still materialize (its cy.intercept
  // handler needs real bytes, not the empty stream stand-in). A route
  // disabled by an earlier request must not be revived for a *later* one:
  // that request never matched anything, so it correctly streams instead of
  // risking a hang on an endless body (the bug this composition fixes —
  // the old response-time re-match un-hid the disabled route for every
  // later request too).
  //
  // Header fidelity (case-insensitive route `headers` matchers against
  // browser-cased request headers) is no longer a concern at the response
  // pause either: with no re-match, the only header view a route matcher
  // ever sees is the one SetMatchingRoutes already lowercased at request
  // stage.
  it('materializes the request that spends a times-limited route, then streams the next one against the now-disabled route', async () => {
    const client = createCdpClient({ withBody: true })
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const timesRoute = minimalMatchingRoute('route-times')

    timesRoute.routeMatcher.times = 1
    runtime.netStubbingState.routes.push(timesRoute)

    const onRequestPaused = await startCdpRuntime(runtime, client)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'times-first-request',
      networkId: 'network-times-first',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectCalledWith(client.send, 'Fetch.getResponseBody')
    expect(timesRoute.disabled).toBe(true)

    client.send.mockClear()

    await drivePausedRequest(onRequestPaused, {
      requestId: 'times-second-request',
      networkId: 'network-times-second',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectNotCalledWith(client.send, 'Fetch.getResponseBody')
    expectCalledWith(client.send, 'Fetch.continueResponse')
  })

  it('reads stubbingState.routes live — a route registered after the first stream-classified request still forces the next one to materialize', async () => {
    const client = createCdpClient({ withBody: true })
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'ndjson-first',
      networkId: 'network-ndjson-first',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectNotCalledWith(client.send, 'Fetch.getResponseBody')

    client.send.mockClear()
    runtime.netStubbingState.routes.push(minimalMatchingRoute('route-2'))

    await drivePausedRequest(onRequestPaused, {
      requestId: 'ndjson-second',
      networkId: 'network-ndjson-second',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectCalledWith(client.send, 'Fetch.getResponseBody')
  })

  // Every other test in this file leaves both obstructive-code flags
  // undefined, so this is the only coverage that config.modifyObstructiveCode
  // actually threads through createCdpFetchRuntime into the composed
  // shouldStreamBody predicate (network-runtime.ts passes deps.config.modifyObstructiveCode
  // straight through to shouldStreamResponseBody).
  it('threads modifyObstructiveCode from config into the body predicate', async () => {
    const client = createCdpClient({ withBody: true })
    const runtime = createCdpFetchRuntime({
      ...baseDeps(),
      config: {
        clientRoute: '/__/',
        responseTimeout: 30000,
        modifyObstructiveCode: true,
      } as Cypress.Config,
      client,
    })
    const onRequestPaused = await startCdpRuntime(runtime, client)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'js-rewrite-request',
      networkId: 'network-js-rewrite-1',
      url: 'https://example.test/script.js',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'text/javascript' }],
    })

    expectCalledWith(client.send, 'Fetch.getResponseBody')
  })

  it('arms capture for a stream-classified response once a protocol manager with isProtocolEnabled true is applied after createCdpFetchRuntime returns', async () => {
    const client = createCdpClient()
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    // Mirrors production: server-base applies the protocol manager to
    // networkProxy (via setProtocolManager) only after createCdpFetchRuntime
    // has already returned it.
    runtime.networkProxy.setProtocolManager({ isProtocolEnabled: true } as any)

    const onRequestPaused = await startCdpRuntime(runtime, client)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'sse-request-armed',
      networkId: 'network-sse-armed',
      url: 'https://example.test/events',
      resourceType: 'EventSource',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
    })

    const armCall = findCall(client.send, 'Network.streamResourceContent')

    expect(armCall, 'expected Network.streamResourceContent to arm capture').toBeDefined()
    expect(armCall![1]).toStrictEqual({ requestId: 'network-sse-armed' })
  })

  it('does not arm capture when the protocol manager reports isProtocolEnabled false', async () => {
    const client = createCdpClient()
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    runtime.networkProxy.setProtocolManager({ isProtocolEnabled: false } as any)

    const onRequestPaused = await startCdpRuntime(runtime, client)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'sse-request-disabled',
      networkId: 'network-sse-disabled',
      url: 'https://example.test/events',
      resourceType: 'EventSource',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
    })

    expectNotCalledWith(client.send, 'Network.streamResourceContent')
  })

  it('attachExtraTarget transports share the same shouldStreamBody composition as the main transport', async () => {
    const mainClient = createCdpClient()
    const extraClient = createCdpClient({ withBody: true })
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client: mainClient })

    await runtime.start()
    await runtime.attachExtraTarget(extraClient)

    const onExtraPaused = wirePausedHandler(extraClient)

    await drivePausedRequest(onExtraPaused, {
      requestId: 'extra-ndjson-request',
      networkId: 'extra-network-ndjson-1',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectNotCalledWith(extraClient.send, 'Fetch.getResponseBody')

    // ExtractCypressMetadataHeaders restricts an extra-target request to the
    // bare-minimum middleware (MaybeSetBasicAuthHeaders) — SetMatchingRoutes
    // never runs for it, so a route registered in netStubbingState has no
    // request-stage match to thread through, and the pause still streams.
    extraClient.send.mockClear()
    runtime.netStubbingState.routes.push(minimalMatchingRoute('extra-route-1'))

    await drivePausedRequest(onExtraPaused, {
      requestId: 'extra-ndjson-unrouted-request',
      networkId: 'extra-network-ndjson-2',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectNotCalledWith(extraClient.send, 'Fetch.getResponseBody')

    // shouldCaptureBody parity: with recording on, a stream-classified pause
    // on the extra target arms capture on the extra target's own client
    runtime.networkProxy.setProtocolManager({ isProtocolEnabled: true } as any)
    runtime.netStubbingState.routes.length = 0
    extraClient.send.mockClear()

    await drivePausedRequest(onExtraPaused, {
      requestId: 'extra-armed-request',
      networkId: 'extra-network-armed',
      url: 'https://example.test/stream',
      resourceType: 'Fetch',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'application/x-ndjson' }],
    })

    expectCalledWith(extraClient.send, 'Network.streamResourceContent', {
      requestId: 'extra-network-armed',
    })

    await runtime.stop()
  })

  it('stops arming capture when the protocol manager is cleared mid-run', async () => {
    const client = createCdpClient()
    const runtime = createCdpFetchRuntime({ ...baseDeps(), client })

    runtime.networkProxy.setProtocolManager({ isProtocolEnabled: true } as any)

    const onRequestPaused = await startCdpRuntime(runtime, client)

    // the other half of the late-binding contract: clearing the manager must
    // take effect on the very next pause, not at the next runtime start
    runtime.networkProxy.setProtocolManager(undefined as any)

    await drivePausedRequest(onRequestPaused, {
      requestId: 'sse-request-cleared',
      networkId: 'network-sse-cleared',
      url: 'https://example.test/events',
      resourceType: 'EventSource',
      responseStatusCode: 200,
      responseHeaders: [{ name: 'content-type', value: 'text/event-stream' }],
    })

    expectNotCalledWith(client.send, 'Network.streamResourceContent')
  })
})
