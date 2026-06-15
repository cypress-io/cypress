import type { ForNetworkPolicyRegistration } from '../ports/driving-ports'
import { createBlockedHosts } from './blocked-hosts'
import type { BlockedHostsConfig } from './blocked-hosts'
import { createCspAllowList } from './csp-allow-list'
import { createDocumentRewrite } from './document-rewrite'

export type RegisterDefaultNetworkPoliciesConfig = {
  blockHosts?: string | string[] | null
  experimentalCspAllowList?: boolean | string[] | null
  modifyObstructiveCode?: boolean
  experimentalModifyObstructiveThirdPartyCode?: boolean
}

export type RegisterDefaultNetworkPoliciesDeps = {
  matchesBlockedHost: NonNullable<BlockedHostsConfig['matchesBlockedHost']>
}

/**
 * Register configurator policies derived from Cypress project config.
 * Policies are stored in the registry and enforced by
 * {@link NetworkInterceptionCore.endRequestIfBlocked} from proxy request middleware.
 */
export function registerDefaultNetworkPolicies (
  policies: ForNetworkPolicyRegistration,
  config: RegisterDefaultNetworkPoliciesConfig,
  deps: RegisterDefaultNetworkPoliciesDeps,
): void {
  policies.add(createBlockedHosts({
    config,
    matchesBlockedHost: deps.matchesBlockedHost,
  }))

  policies.add(createCspAllowList({
    experimentalCspAllowList: config.experimentalCspAllowList,
  }))

  policies.add(createDocumentRewrite({
    modifyObstructiveCode: config.modifyObstructiveCode,
    experimentalModifyObstructiveThirdPartyCode: config.experimentalModifyObstructiveThirdPartyCode,
  }))
}
