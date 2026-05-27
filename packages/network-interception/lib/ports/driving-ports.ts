import type { NetEvent } from '../types'

/**
 * Driving port: test definition (`cy.intercept`, driver handler resolution).
 */
export interface ForInterceptRegistration {
  handleEvent (event: NetEvent.ToServer.DriverEvent): Promise<unknown>
}

/**
 * Driving port: Cypress configurator (CSP, default rewrites, blockHosts).
 */
export interface NetworkPolicyHooks {
  // Expanded in Stage 2a/2b.
}

export interface ForNetworkPolicyRegistration {
  registerPolicy (hooks: NetworkPolicyHooks): void
}
