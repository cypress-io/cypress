import { blocked } from '@packages/network'
import type { ForNetworkPolicyRegistration } from '@packages/network-interception'
import { CspAllowList, DocumentRewrite } from '@packages/network-interception'
import { createBlockedHosts } from './network-policies/blocked-hosts'

type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
  experimentalCspAllowList?: boolean | string[] | null
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
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

  policies.add(CspAllowList({
    experimentalCspAllowList: config.experimentalCspAllowList,
  }))

  policies.add(DocumentRewrite({
    modifyObstructiveCode: config.modifyObstructiveCode,
    experimentalModifyObstructiveThirdPartyCode: config.experimentalModifyObstructiveThirdPartyCode,
  }))
}
