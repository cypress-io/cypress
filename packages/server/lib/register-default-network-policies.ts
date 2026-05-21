import { blocked } from '@packages/network'
import { BlockedHosts } from '@packages/network-policy'
import type { ForNetworkPolicyRegistration } from '@packages/network-policy'

export type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
}

/**
 * Register configurator policies derived from Cypress project config.
 * Policies are stored in the registry; request-phase enforcement is wired in Stage 3+ via {@link NetworkPolicyCore}.
 */
export function registerDefaultNetworkPolicies (
  policies: ForNetworkPolicyRegistration,
  config: RegisterDefaultNetworkPoliciesConfig,
): void {
  policies.add(BlockedHosts({
    blockHosts: config.blockHosts,
    matchesBlockedHost: blocked.matches,
  }))
}
