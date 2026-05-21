import { blocked } from '@packages/network'
import { BlockedHosts } from '@packages/network-policy'
import type { ForNetworkPolicyRegistration } from '@packages/network-policy'

export type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
}

/**
 * Register configurator policies derived from Cypress project config.
 * Policies are stored in the registry only — proxy middleware is unchanged until Stage 3+.
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
