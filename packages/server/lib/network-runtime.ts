import type EventEmitter from 'events'
import { NetworkProxy, BrowserPreRequest } from '@packages/proxy'
import { defaultMiddleware } from '@packages/proxy/lib/http'
import { netStubbingState, NetStubbingState } from '@packages/net-stubbing'
import { NetworkPolicyRegistry, NetworkInterceptionCore } from '@packages/network-interception'
import type { ForNetworkPolicyRegistration, NetworkInterceptionRuntime } from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'
import type { RemoteStates } from '@packages/network-tools'
import type { CookieJar } from './util/cookies'
import type { Request as ServerRequest } from './request'
import type CyServer from '../index.d.ts'
import type { FoundBrowser, ProtocolManagerShape } from '@packages/types'
import { registerDefaultNetworkPolicies } from './register-default-network-policies'

type CreateProxyRuntimeDeps = {
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

type ProxyNetworkRuntime = NetworkInterceptionRuntime & {
  networkProxy: NetworkProxy
  netStubbingState: NetStubbingState
  networkPolicyRegistration: ForNetworkPolicyRegistration
  networkInterceptionCore: NetworkInterceptionCore
}

/**
 * Composition-root factory for the proxy-default network runtime.
 */
export function createProxyRuntime (deps: CreateProxyRuntimeDeps): ProxyNetworkRuntime {
  const stubbingState = netStubbingState()
  const networkPolicyRegistration: ForNetworkPolicyRegistration = new NetworkPolicyRegistry()
  const networkInterceptionCore = new NetworkInterceptionCore()

  registerDefaultNetworkPolicies(networkPolicyRegistration, deps.config)

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
