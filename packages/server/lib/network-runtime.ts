import Debug from 'debug'
import type EventEmitter from 'events'
import { NetworkProxy, BrowserPreRequest, createProxyNetworkInterception, createSyntheticProxyCodec, defaultMiddleware } from '@packages/proxy'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
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
}

export type ProxyNetworkRuntime = NetworkInterceptionRuntime & {
  networkProxy: NetworkProxy
  netStubbingState: NetStubbingState
  networkPolicyRegistration: ForNetworkPolicyRegistration
  networkInterceptionCore: NetworkInterceptionCore
}

export type CreateCdpFetchRuntimeDeps = {
  // onServiceWorkerTargetAttached is a settable hook: the runtime assigns it
  // so service worker sessions get Fetch enabled before they start running.
  client: Pick<ICriClient, 'send' | 'on' | 'off' | 'onServiceWorkerTargetAttached'>
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
  // Prefer the state already bound to the driver socket (created at open()).
  netStubbingState?: NetStubbingState
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
  const stubbingState = netStubbingState()
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
  const stubbingState = deps.netStubbingState ?? netStubbingState()
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

  // Express handleHttpRequest (studio/cy-prompt forwards) needs the proxy codec;
  // CDP Fetch needs its own codec. Share middleware stages, keep intercepts distinct.
  const serveInternalRoutes = createServeInternalRoutesMiddleware({
    config: deps.config,
    request: deps.request,
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

      // A service worker's network runs on its own CDP session — without
      // enabling Fetch there, its script fetch and fetch-handler requests
      // bypass the middleware onion (and cy.intercept) entirely.
      deps.client.onServiceWorkerTargetAttached = (sessionId) => {
        return fetchTransport.attachServiceWorkerSession(sessionId)
      }

      try {
        await fetchTransport.start()
      } catch (err) {
        deps.client.onServiceWorkerTargetAttached = undefined
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
      deps.client.onServiceWorkerTargetAttached = undefined
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
