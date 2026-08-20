import Debug from 'debug'
import type EventEmitter from 'events'
import type { Protocol } from 'devtools-protocol'
import { NetworkProxy, BrowserPreRequest, createProxyNetworkInterception, createSyntheticProxyCodec, defaultMiddleware } from '@packages/proxy'
import type { NetStubbingState } from '@packages/net-stubbing'
import { HttpIntercept, registerDefaultNetworkPolicies } from '@packages/network-interception'
import type { NetworkInterceptionRuntime, ForNetworkPolicyRegistration, NetworkInterceptionCore, TransportCodecPort } from '@packages/network-interception'
import { blocked } from '@packages/network'
import type { SocketBroadcaster } from '@packages/socket'
import type { RemoteStates } from '@packages/network-tools'
import { toFileServerUrl } from '@packages/network-tools'
import type { CookieJar } from './automation/cookie/jar'
import type { Request as ServerRequest } from './request'
import type CyServer from '../index.d.ts'
import type { FoundBrowser, ProtocolManagerShape, ExtraTargetDetach } from '@packages/types'
import { ConfiguratorNetworkPolicyAdapter } from './adapters/configurator-network-policy'
import type { ICriClient } from './browsers/cdp-protocol/cri-client'
import { DEFAULT_NETWORK_ENABLE_OPTIONS } from './browsers/cdp-protocol/cri-client'
import { createCdpFetchCodec } from './browsers/cdp-protocol/cdp-fetch-codec'
import { CdpFetchTransport } from './browsers/cdp-protocol/cdp-fetch-transport'
import type { CdpFetchTransportRequest, CdpFetchTransportResponse } from './browsers/cdp-protocol/cdp-fetch-transport'
import { shouldStreamResponseBody } from './browsers/cdp-protocol/should-stream-response-body'
import { normalizeResourceType } from './browsers/cdp-protocol/normalize-resource-type'
import { createServeInternalRoutesMiddleware } from './adapters/serve-internal-routes'
import { CYPRESS_INTERNAL_LOOPBACK_HEADER, CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER, cypressInternalLoopbackToken, resolveProxyUrlBase } from './adapters/internal-routes'

const debug = Debug('cypress:server:network-runtime')

export type CreateProxyRuntimeDeps = {
  config: CyServer.Config & Cypress.Config
  shouldCorrelatePreRequests?: () => boolean
  remoteStates: RemoteStates
  getFileServerToken: () => string | undefined
  getCookieJar: () => CookieJar
  socket: SocketBroadcaster
  request: ServerRequest
  serverBus: EventEmitter
  getCurrentBrowser: () => FoundBrowser
  // Required, not created here: the server owns one state for its whole lifetime
  // and every network runtime shares it.
  netStubbingState: NetStubbingState
}

export type ProxyNetworkRuntime = NetworkInterceptionRuntime & {
  networkProxy: NetworkProxy
  netStubbingState: NetStubbingState
  networkPolicyRegistration: ForNetworkPolicyRegistration
  networkInterceptionCore: NetworkInterceptionCore
}

export type CreateCdpFetchRuntimeDeps = {
  // onChildTargetAttached is a settable hook: the runtime assigns it so
  // child sessions (service workers, origin-isolated iframes) get Fetch
  // enabled before they start running.
  client: Pick<ICriClient, 'send' | 'on' | 'off' | 'onChildTargetAttached'>
  isAUTFrame?: (frameId: string) => Promise<boolean>
  // Protocol-neutral subscription to AUT document navigation commits,
  // provided by the automation layer (CdpAutomation.onAUTFrameNavigated).
  onAUTFrameNavigated?: (listener: (url: string) => void) => () => void
  config: CyServer.Config & Cypress.Config
  shouldCorrelatePreRequests?: () => boolean
  remoteStates: RemoteStates
  getFileServerToken: () => string | undefined
  getCookieJar: () => CookieJar
  socket: SocketBroadcaster
  request: ServerRequest
  serverBus: EventEmitter
  getCurrentBrowser: () => FoundBrowser
  // Required: DriverInterceptRegistrationAdapter is bound by value to the state
  // created at open(), so a second NetStubbingState here would leave every
  // cy.intercept() registered against a state this runtime never matches.
  netStubbingState: NetStubbingState
}

export type CdpFetchNetworkRuntime = {
  networkProxy: NetworkProxy
  netStubbingState: NetStubbingState
  networkPolicyRegistration: ForNetworkPolicyRegistration
  networkInterceptionCore: NetworkInterceptionCore
  networkInterception: HttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse>
  fetchTransport: CdpFetchTransport
  /**
   * Attaches a CdpFetchTransport to an extra-target (popup / _blank) CDP
   * session so its requests run the shared middleware onion with the
   * extra-target marker. Returns detach() to stop that transport.
   */
  attachExtraTarget (client: Pick<ICriClient, 'send' | 'on' | 'off'>): Promise<ExtraTargetDetach>
  start (): Promise<void>
  reset (): void
  stop (): Promise<void>
}

/**
 * Composition-root factory for the proxy-default network runtime.
 */
export function createProxyRuntime (deps: CreateProxyRuntimeDeps): ProxyNetworkRuntime {
  const stubbingState = deps.netStubbingState
  const networkPolicyRegistration = new ConfiguratorNetworkPolicyAdapter()

  registerDefaultNetworkPolicies(networkPolicyRegistration, deps.config, {
    matchesBlockedHost: blocked.matches,
  })

  const networkInterceptionCore = createProxyNetworkInterception({
    policyRegistration: networkPolicyRegistration,
  })

  const networkProxy = new NetworkProxy({
    config: deps.config,
    shouldCorrelatePreRequests: deps.shouldCorrelatePreRequests,
    remoteStates: deps.remoteStates,
    getFileServerToken: deps.getFileServerToken,
    getCookieJar: deps.getCookieJar,
    socket: deps.socket,
    netStubbingState: stubbingState,
    networkInterceptionCore,
    request: deps.request,
    serverBus: deps.serverBus,
    getCurrentBrowser: deps.getCurrentBrowser,
    middleware: defaultMiddleware,
    getRenderedHTMLOrigins: () => ({}),
  })
  const networkInterception = new HttpIntercept(networkProxy.codec)

  networkInterception.use(createServeInternalRoutesMiddleware({
    config: deps.config,
    request: deps.request,
    isBrowserNetworkMode: false,
  }))

  networkInterception.use(networkProxy.http.createLegacyProxyPipeline(networkProxy.codec))
  networkProxy.withIntercept(networkInterception)

  return {
    networkProxy,
    netStubbingState: stubbingState,
    networkPolicyRegistration,
    networkInterceptionCore,
    handleHttpRequest (req, res) {
      return networkProxy.handleHttpRequest(req, res)
    },
    setProtocolManager (protocolManager?: ProtocolManagerShape) {
      networkProxy.setProtocolManager(protocolManager)
    },
    reset (options?: { resetBetweenSpecs?: boolean }) {
      networkProxy.reset({ resetBetweenSpecs: options?.resetBetweenSpecs ?? false })
    },
    clearCredentials () {
      networkProxy.clearCredentials()
    },
    addBrowserPreRequest (preRequest: BrowserPreRequest) {
      return networkProxy.addPendingBrowserPreRequest(preRequest)
    },
  }
}

const RUNTIME_STOPPED_ERROR = 'Cannot attach extra target: CDP Fetch runtime has been stopped'

/**
 * Composition-root factory for the CDP Fetch network runtime used when the
 * MITM proxy is disabled. Reuses NetworkProxy so the legacy middleware
 * pipeline (cookies, hosts, blockHosts, rewriter, net-stubbing) runs through
 * a synthetic Express ctx via createSyntheticProxyCodec.
 */
export function createCdpFetchRuntime (deps: CreateCdpFetchRuntimeDeps): CdpFetchNetworkRuntime {
  const stubbingState = deps.netStubbingState
  const networkPolicyRegistration = new ConfiguratorNetworkPolicyAdapter()

  registerDefaultNetworkPolicies(networkPolicyRegistration, deps.config, {
    matchesBlockedHost: blocked.matches,
  })

  const networkInterceptionCore = createProxyNetworkInterception({
    policyRegistration: networkPolicyRegistration,
  })

  const networkProxy = new NetworkProxy({
    config: deps.config,
    shouldCorrelatePreRequests: deps.shouldCorrelatePreRequests,
    remoteStates: deps.remoteStates,
    getFileServerToken: deps.getFileServerToken,
    getCookieJar: deps.getCookieJar,
    socket: deps.socket,
    netStubbingState: stubbingState,
    networkInterceptionCore,
    request: deps.request,
    serverBus: deps.serverBus,
    getCurrentBrowser: deps.getCurrentBrowser,
    middleware: defaultMiddleware,
    getRenderedHTMLOrigins: () => ({}),
  })

  // Shared by the main transport and every extra-target transport so a popup
  // can never classify or gate capture differently than the page that opened
  // it — both pause through the same stubbingState and networkInterceptionCore.
  //
  // Deliberately looser than SetMatchingRoutes in two safe-direction ways: it
  // skips the dev-server exclusion, and it re-matches at response time against
  // the possibly-handler-mutated request URL. Both can only over-materialize.
  const shouldStreamBody = (event: Protocol.Fetch.RequestPausedEvent): boolean => {
    return shouldStreamResponseBody(event, {
      modifyObstructiveCode: deps.config.modifyObstructiveCode,
      experimentalModifyObstructiveThirdPartyCode: deps.config.experimentalModifyObstructiveThirdPartyCode,
      hasMatchingRoute: (pausedEvent) => {
        // `times` exhaustion disables a route during request-stage counting, but
        // its already-matched response still reaches InterceptResponse — a spent
        // route's body is still needed, so match as if nothing were disabled.
        // (debug.routes logs from this re-match report spent routes as matched;
        // the authoritative match is the request-stage one.)
        const routes = stubbingState.routes.map((route) => route.disabled ? { ...route, disabled: false } : route)

        // CDP preserves the browser's header casing; route matchers (auth,
        // headers) expect the middleware's lowercased view.
        const headers = Object.fromEntries(Object.entries(pausedEvent.request.headers).map(([name, value]) => [name.toLowerCase(), value]))

        return networkInterceptionCore.matchRoutes(routes, {
          headers,
          method: pausedEvent.request.method,
          proxiedUrl: pausedEvent.request.url,
          resourceType: normalizeResourceType(pausedEvent.resourceType),
        }).length > 0
      },
    })
  }

  // server-base applies the protocol manager to networkProxy.http after this
  // factory returns (and may clear it later), so this must read the field
  // fresh on every call rather than capturing today's value.
  const shouldCaptureBody = (): boolean => networkProxy.http.protocolManager?.isProtocolEnabled ?? false

  // Express handleHttpRequest (studio/cy-prompt forwards) needs the proxy codec;
  // CDP Fetch needs its own codec. Share middleware stages, keep intercepts distinct.
  const serveInternalRoutes = createServeInternalRoutesMiddleware({
    config: deps.config,
    request: deps.request,
    isBrowserNetworkMode: true,
  })

  const attachStages = <TRequest, TResponse>(
    intercept: HttpIntercept<TRequest, TResponse>,
    pipelineCodec: TransportCodecPort<any, any>,
  ) => {
    intercept.use(serveInternalRoutes)
    intercept.use(networkProxy.http.createLegacyProxyPipeline(pipelineCodec))

    return intercept
  }

  const expressInterception = attachStages(
    new HttpIntercept(networkProxy.codec),
    networkProxy.codec,
  )

  networkProxy.withIntercept(expressInterception)

  const syntheticCodec = createSyntheticProxyCodec({
    createMiddlewareContext: (req, res) => networkProxy.http.createMiddlewareContext(req, res),
  })

  const networkInterception = attachStages(
    new HttpIntercept(createCdpFetchCodec()),
    syntheticCodec,
  )

  // Every transport shares one synthetic codec, so a canceled request is torn
  // down through the same exchange map no matter which target it paused on.
  const onRequestCanceled = (requestId: string) => syntheticCodec.abortRequest(requestId)

  // Send strategy:file requests to the origin server over the wire, and let
  // Express serve them from the file server, rather than answering the pause
  // here in Node. Two things depend on it:
  //   - visit documents. Their response is already buffered by the resolve:url
  //     pre-flight, so answering the pause would fulfill from that buffer and
  //     the browser would never make a request. No request means no
  //     Network.*ExtraInfo and no HTTP caching for the document.
  //   - subresources. They reach the origin either way, but continuing them
  //     here runs the middleware on the CDP side first and again on the
  //     Express side, so the pipeline would process them twice.
  // Releasing both pauses untouched leaves Express as the single owner of
  // the middleware. The loopback headers mark the request as ours so the
  // catch-all serves it under the URL the page actually asked for.
  // Shared with extra-target transports: popup file traffic reaches Express
  // the same way, so it needs the same single-owner release.
  const resolveOriginRedirect = (url: string) => {
    if (!toFileServerUrl(url, deps.remoteStates.current())) {
      return undefined
    }

    const parsed = new URL(url)

    return {
      // Identity today — a strategy:file remote state always resolves to our
      // own origin — but this keeps the request pointed at us if that stops
      // holding, rather than letting it escape to a host we do not serve.
      url: new URL(`${parsed.pathname}${parsed.search}`, resolveProxyUrlBase(deps.config)).href,
      headers: {
        [CYPRESS_INTERNAL_LOOPBACK_HEADER]: url,
        [CYPRESS_INTERNAL_LOOPBACK_TOKEN_HEADER]: cypressInternalLoopbackToken,
      },
    }
  }

  const fetchTransport = new CdpFetchTransport(deps.client, networkInterception, {
    isAUTFrame: deps.isAUTFrame,
    // Download-manager pauses omit networkId and never emit requestWillBeSent;
    // pre-register so CorrelateBrowserPreRequest does not wait the full timeout.
    addPendingUrlWithoutPreRequest: (url) => networkProxy.addPendingUrlWithoutPreRequest(url),
    resolveOriginRedirect,
    onRequestCanceled,
    shouldStreamBody,
    shouldCaptureBody,
  })

  // Extra-target transports share networkInterception so they cannot drift from
  // the main-target middleware onion. Tracked so reset()/stop() cover them.
  // request ids are namespaced inside each extra CdpFetchTransport so concurrent
  // sessions cannot collide in the shared codec maps.
  const extraTargetTransports = new Set<CdpFetchTransport>()
  let stopped = false

  // Proxy parity: cookie simulation's simulated top, which nothing else
  // updates when the proxy is off. Sourced from navigation commits because
  // cache-served documents never produce a Fetch pause. Only http(s) commits
  // count — about:blank (test isolation), data:, and blob: never transit
  // the proxy.
  const onAUTFrameNavigated = (url: string) => {
    if (/^https?:/.test(url)) {
      networkProxy.http.setAUTUrl(url)
    }
  }

  let unsubscribeAUTFrameNavigated: (() => void) | undefined

  return {
    networkProxy,
    netStubbingState: stubbingState,
    networkPolicyRegistration,
    networkInterceptionCore,
    networkInterception,
    fetchTransport,
    async attachExtraTarget (client) {
      if (stopped) {
        throw new Error(RUNTIME_STOPPED_ERROR)
      }

      const extraTransport = new CdpFetchTransport(client, networkInterception, {
        isFromExtraTarget: true,
        resolveOriginRedirect,
        onRequestCanceled,
        shouldStreamBody,
        shouldCaptureBody,
      })

      await extraTransport.start()

      if (stopped) {
        // Not awaited, for the same reason stop() itself does not await extras:
        // a dead extra-target socket may never answer Fetch.disable, and this
        // must reject promptly so _onAttachToTarget's caller reaches its
        // fallback instead of suspending the Target.attachedToTarget handler.
        extraTransport.stop().catch(() => {})

        throw new Error(RUNTIME_STOPPED_ERROR)
      }

      // CDPNetworkExtraInfo (Set-Cookie capture) needs Network on this dedicated
      // session — the browser-level Network.enable in _onAttachToTarget does not
      // apply here. It cannot be awaited: the target is auto-attached
      // debugger-paused, and Network.enable's response requires the paused
      // renderer, which only unpauses after this hook returns (#34512).
      // Fetch.enable above is browser-serviced, so interception is already in
      // place while paused; extra-info merging degrades gracefully if this
      // settles late or the target is already closing.
      client.send('Network.enable', DEFAULT_NETWORK_ENABLE_OPTIONS).catch((err) => {
        debug('extra-target Network.enable failed: %s', err?.message || err)
      })

      extraTargetTransports.add(extraTransport)

      return async () => {
        extraTargetTransports.delete(extraTransport)

        try {
          await extraTransport.stop()
        } catch {
          // Extra-target sockets are usually already gone when detach runs.
        }
      }
    },
    async start () {
      unsubscribeAUTFrameNavigated = deps.onAUTFrameNavigated?.(onAUTFrameNavigated)

      // Service workers and out-of-process iframes have their own CDP
      // session — without enabling Fetch there, a worker's script fetch and an
      // out-of-process iframe's (OOPIF) subresources (e.g. a cross-origin spec
      // bridge's runner bundle) bypass the middleware onion entirely and
      // escape to the real origin.
      deps.client.onChildTargetAttached = (sessionId) => {
        return fetchTransport.attachChildSession(sessionId)
      }

      try {
        await fetchTransport.start()
      } catch (err) {
        deps.client.onChildTargetAttached = undefined
        unsubscribeAUTFrameNavigated?.()
        unsubscribeAUTFrameNavigated = undefined

        throw err
      }
    },
    // Transport only — callers (server-base) already own networkProxy.reset so
    // we do not double-reset with a conflicting resetBetweenSpecs flag.
    reset () {
      fetchTransport.reset()

      for (const extraTransport of extraTargetTransports) {
        extraTransport.reset()
      }
    },
    async stop () {
      stopped = true
      deps.client.onChildTargetAttached = undefined
      unsubscribeAUTFrameNavigated?.()
      unsubscribeAUTFrameNavigated = undefined

      // Not awaited, for the same reason _onTargetDestroyed and
      // closeExtraTargets do not await detach: a dead extra-target socket may
      // never answer Fetch.disable, and stop() runs ahead of HTTP server
      // teardown — it must not be able to hang that.
      for (const extraTransport of extraTargetTransports) {
        extraTransport.stop().catch(() => {
          // Extra-target sockets are usually already gone.
        })
      }

      extraTargetTransports.clear()

      return fetchTransport.stop()
    },
  }
}
