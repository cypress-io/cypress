import { blocked } from '@packages/network'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'
import { createBlockedHosts } from './network-policies/blocked-hosts'

type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
}

/**
 * Register configurator policies derived from Cypress project config.
 * Server-owned mapping from config → {@link NetworkPolicy} instances.
 * Policies are stored via the driving port only; middleware is unchanged until stage 7.
 */
export function registerDefaultNetworkPolicies (
  policies: ForNetworkPolicyRegistration,
  config: RegisterDefaultNetworkPoliciesConfig,
): void {
  policies.add(createBlockedHosts({
    blockHosts: config.blockHosts,
    matchesBlockedHost: blocked.matches,
  }))
}
