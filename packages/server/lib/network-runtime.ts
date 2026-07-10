import type EventEmitter from 'events'
import { NetworkProxy, BrowserPreRequest, createProxyNetworkInterception, defaultMiddleware, createSyntheticHttpCodec } from '@packages/proxy'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { HttpIntercept, registerDefaultNetworkPolicies } from '@packages/network-interception'
import type { NetworkInterceptionRuntime, ForNetworkPolicyRegistration, NetworkInterceptionCore } from '@packages/network-interception'
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

export type CreateCdpFetchRuntimeDeps = CreateProxyRuntimeDeps & {
  client: Pick<ICriClient, 'send' | 'on' | 'off'>
}

export type CdpFetchNetworkRuntime = {
  networkProxy: NetworkProxy
  netStubbingState: NetStubbingState
  networkPolicyRegistration: ForNetworkPolicyRegistration
  networkInterceptionCore: NetworkInterceptionCore
  networkInterception: HttpIntercept<CdpFetchTransportRequest, CdpFetchTransportResponse>
  fetchTransport: CdpFetchTransport
  start (): Promise<void>
  reset (): Promise<void>
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
 * Composition-root factory for the CDP Fetch network runtime.
 *
 * This is intentionally not wired into the default proxy runtime yet. The
 * HTTP/2 migration can opt into it with an existing cri-client while preserving
 * the minimal HttpRequest/HttpResponse transport-neutral contract.
 */
export function createCdpFetchRuntime (deps: CreateCdpFetchRuntimeDeps): CdpFetchNetworkRuntime {
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
  const networkInterception = new HttpIntercept(createCdpFetchCodec())
  const syntheticCodec = createSyntheticHttpCodec({
    createMiddlewareContext: (req, res) => networkProxy.http.createMiddlewareContext(req, res),
  })

  networkInterception.use(networkProxy.http.createLegacyProxyPipeline(syntheticCodec))
  // Keep the proxy-codec intercept for NetworkProxy.handleHttpRequest; the CDP
  // codec intercept is owned by CdpFetchTransport and must not be shared.
  networkProxy.withIntercept(new HttpIntercept(networkProxy.codec))

  const fetchTransport = new CdpFetchTransport(deps.client, networkInterception)

  return {
    networkProxy,
    netStubbingState: stubbingState,
    networkPolicyRegistration,
    networkInterceptionCore,
    networkInterception,
    fetchTransport,
    start () {
      return fetchTransport.start()
    },
    reset () {
      return fetchTransport.stop()
    },
  }
}
