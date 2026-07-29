import { NetworkInterceptionCore } from '@packages/network-interception'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'
import { IdentityContentEncodingAdapter } from './identity-content-encoding'
import { ProxyCommandLogAdapter } from './proxy-command-log'
import { ProxyContentEncodingAdapter } from './content-encoding'
import { ProxyCookieStateAdapter } from './proxy-cookie-state'
import { ProxyDocumentPreparationAdapter } from './proxy-document-preparation'
import { ProxyNetworkCaptureAdapter } from './proxy-network-capture'
import { ProxyRequestInterceptionAdapter } from './proxy-request-interception'
import { ProxyResponseInterceptionAdapter } from './proxy-response-interception'

export type CreateProxyNetworkInterceptionOptions = {
  policyRegistration?: ForNetworkPolicyRegistration
}

/**
 * Composition-root helper: wire all default proxy driven-port adapters into {@link NetworkInterceptionCore}.
 */
export function createProxyNetworkInterception (
  options: CreateProxyNetworkInterceptionOptions = {},
): NetworkInterceptionCore {
  return new NetworkInterceptionCore({
    policyRegistration: options.policyRegistration,
    requestInterception: new ProxyRequestInterceptionAdapter(),
    responseInterception: new ProxyResponseInterceptionAdapter(),
    documentPreparation: new ProxyDocumentPreparationAdapter(),
    networkCapture: new ProxyNetworkCaptureAdapter(),
    cookieState: new ProxyCookieStateAdapter(),
    commandLog: new ProxyCommandLogAdapter(),
    // Requests select by the pipeline's declared bodyEncoding ('wire' unless
    // declared otherwise). 'wire' is the express path — MITM proxied traffic,
    // and the express pipeline (studio/cy-prompt forwards) that still serves
    // over a real socket when the proxy is disabled. 'identity' is the CDP
    // path, where fulfilled bodies must ship fully decoded.
    contentEncoding: {
      wire: new ProxyContentEncodingAdapter(),
      identity: new IdentityContentEncodingAdapter(),
    },
  })
}
