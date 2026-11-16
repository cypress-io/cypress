import { NetworkInterceptionCore } from '@packages/network-interception'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'
import { ProxyCommandLogAdapter } from './proxy-command-log'
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
  })
}
