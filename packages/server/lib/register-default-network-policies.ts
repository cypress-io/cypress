import { blocked } from '@packages/network'
import { BlockedHosts, CspAllowList, DocumentRewrite } from '@packages/network-interception'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'

export type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
  experimentalCspAllowList?: boolean | string[] | null
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
}

/**
 * Register configurator policies derived from Cypress project config.
 * Policies are stored in the registry; request-phase enforcement is wired in Stage 3+ via {@link NetworkInterceptionCore}.
 */
export function registerDefaultNetworkPolicies (
  policies: ForNetworkPolicyRegistration,
  config: RegisterDefaultNetworkPoliciesConfig,
): void {
  policies.add(BlockedHosts({
    blockHosts: config.blockHosts,
    matchesBlockedHost: blocked.matches,
  }))

  policies.add(CspAllowList({
    experimentalCspAllowList: config.experimentalCspAllowList,
  }))

  policies.add(DocumentRewrite({
    modifyObstructiveCode: config.modifyObstructiveCode,
    experimentalModifyObstructiveThirdPartyCode: config.experimentalModifyObstructiveThirdPartyCode,
  }))
}
