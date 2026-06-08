import type EventEmitter from 'events'
import { NetworkProxy, BrowserPreRequest } from '@packages/proxy'
import { createDefaultNetworkInterceptionCore } from '@packages/proxy/lib/adapters/create-default-network-interception-core'
import { defaultMiddleware } from '@packages/proxy/lib/http'
import { netStubbingState, NetStubbingState, DriverInterceptionEventsAdapter, applyInterceptWireRequestToHttpRequest, toInterceptWireRequest, toInterceptWireResponse } from '@packages/net-stubbing'
import type {
  NetworkInterceptionRuntime,
  ForNetworkPolicyRegistration,
  NetworkInterceptionCore,
  HttpInterception,
} from '@packages/network-interception'
import type { SocketBroadcaster } from '@packages/socket'
import type { RemoteStates } from '@packages/network-tools'
import type { CookieJar } from './util/cookies'
import type { Request as ServerRequest } from './request'
import type CyServer from '../index.d.ts'
import type { FoundBrowser, ProtocolManagerShape } from '@packages/types'
import { ConfiguratorNetworkPolicyAdapter } from './adapters/configurator-network-policy'
import { registerDefaultNetworkPolicies } from './register-default-network-policies'
import { HttpInterception } from '@packages/network-interception'
import * as errors from '@packages/errors'

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
  networkInterception: HttpInterception
  interceptionEvents: DriverInterceptionEventsAdapter
  /** @deprecated Use {@link networkInterception} */
  httpInterception: HttpInterception
}

/**
 * Composition-root factory for the proxy-default network runtime.
 */
export function createProxyRuntime (deps: CreateProxyRuntimeDeps): ProxyNetworkRuntime {
  const stubbingState = netStubbingState()
  const networkPolicyRegistration = new ConfiguratorNetworkPolicyAdapter()

  registerDefaultNetworkPolicies(networkPolicyRegistration, deps.config)

  const networkInterceptionCore = createDefaultNetworkInterceptionCore({
    policyRegistration: networkPolicyRegistration,
  })

  const interceptionEvents = new DriverInterceptionEventsAdapter({
    state: stubbingState,
    socket: deps.socket,
  })

  const networkInterception = new HttpInterception({
    getRoutes: () => stubbingState.routes,
    interceptionEvents,
    wireMessages: {
      toWireRequest: toInterceptWireRequest,
      toWireResponse: toInterceptWireResponse,
      applyWireRequestToHttpRequest: applyInterceptWireRequestToHttpRequest,
    },
    onSyncInterceptSkipped: (url) => {
      errors.warning('SYNCHRONOUS_XHR_REQUEST_NOT_INTERCEPTED', url)
    },
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
    networkInterception,
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
    networkInterception,
    httpInterception: networkInterception,
    interceptionEvents,
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
