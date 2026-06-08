import { NetworkInterceptionCore } from '@packages/network-interception'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'
import { ProxyCommandLogAdapter } from './proxy-command-log'
import { ProxyCookieStateAdapter } from './proxy-cookie-state'
import { ProxyDocumentPreparationAdapter } from './proxy-document-preparation'
import { ProxyNetworkCaptureAdapter } from './proxy-network-capture'

export type CreateDefaultNetworkInterceptionCoreOptions = {
  policyRegistration?: ForNetworkPolicyRegistration
}

/**
 * Composition-root helper: wire proxy driven-port adapters into {@link NetworkInterceptionCore}.
 */
export function createDefaultNetworkInterceptionCore (
  options: CreateDefaultNetworkInterceptionCoreOptions = {},
): NetworkInterceptionCore {
  return new NetworkInterceptionCore({
    policyRegistration: options.policyRegistration,
    documentPreparation: new ProxyDocumentPreparationAdapter(),
    networkCapture: new ProxyNetworkCaptureAdapter(),
    cookieState: new ProxyCookieStateAdapter(),
    commandLog: new ProxyCommandLogAdapter(),
  })
}
