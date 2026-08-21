export { NetworkProxy } from './network-proxy'

export * from './types'

export { ResourceType, RequestCredentialLevel } from './resourceTypeAndCredentialManager'

export {
  ProxyRequestInterceptionAdapter,
  ProxyResponseInterceptionAdapter,
  ProxyNetworkCaptureAdapter,
  ProxyCookieStateAdapter,
  ProxyCommandLogAdapter,
  createSyntheticProxyCodec,
  createSyntheticExpressContext,
  toIdentityResponse,
} from './adapters'

export { createProxyNetworkInterception } from './adapters/create-proxy-network-interception'

export type { CreateProxyNetworkInterceptionOptions } from './adapters/create-proxy-network-interception'

export { defaultMiddleware, serviceWorkerHeaderIsScript } from './http'

export { contentTypeIsHtml, acceptWillRenderHtml, contentTypeIsJavaScript } from './http/util/document-preparation'
