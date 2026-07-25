import type EventEmitter from 'events'
import { NetworkProxy, BrowserPreRequest, createProxyNetworkInterception, createSyntheticProxyCodec, defaultMiddleware } from '@packages/proxy'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { HttpIntercept, registerDefaultNetworkPolicies } from '@packages/network-interception'
import type { NetworkInterceptionRuntime, ForNetworkPolicyRegistration, NetworkInterceptionCore, TransportCodecPort } from '@packages/network-interception'
import { blocked } from '@packages/network'
import type { SocketBroadcaster } from '@packages/socket'
import type { RemoteStates } from '@packages/network-tools'
import type { CookieJar } from './automation/cookie/jar'
import type { Request as ServerRequest } from './request'
import type CyServer from '../index.d.ts'
import type { FoundBrowser, ProtocolManagerShape } from '@packages/types'
import { ConfiguratorNetworkPolicyAdapter } from './adapters/configurator-network-policy'
import type { ICriClient } from './browsers/cdp-protocol/cri-client'
import { createCdpFetchCodec } from './browsers/cdp-protocol/cdp-fetch-codec'
import { CdpFetchTransport } from './browsers/cdp-protocol/cdp-fetch-transport'
import type { CdpFetchTransportRequest, CdpFetchTransportResponse } from './browsers/cdp-protocol/cdp-fetch-transport'
import { createServeInternalRoutesMiddleware } from './adapters/serve-internal-routes'

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
  client: Pick<ICriClient, 'send' | 'on' | 'off'>
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

  const networkInterception = attachStages(
    new HttpIntercept(createCdpFetchCodec()),
    createSyntheticProxyCodec({
      createMiddlewareContext: (req, res) => networkProxy.http.createMiddlewareContext(req, res),
    }),
  )

  const fetchTransport = new CdpFetchTransport(deps.client, networkInterception, {
    isAUTFrame: deps.isAUTFrame,
  })

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
    async start () {
      unsubscribeAUTFrameNavigated = deps.onAUTFrameNavigated?.(onAUTFrameNavigated)

      try {
        await fetchTransport.start()
      } catch (err) {
        unsubscribeAUTFrameNavigated?.()
        unsubscribeAUTFrameNavigated = undefined

        throw err
      }
    },
    // Transport only — callers (server-base) already own networkProxy.reset so
    // we do not double-reset with a conflicting resetBetweenSpecs flag.
    reset () {
      fetchTransport.reset()
    },
    stop () {
      unsubscribeAUTFrameNavigated?.()
      unsubscribeAUTFrameNavigated = undefined

      return fetchTransport.stop()
    },
  }
}
