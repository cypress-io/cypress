import type { NetEvent } from '../types'

export type InterceptRegistrationEventName =
  | 'route:added'
  | 'subscribe'
  | 'event:handler:resolved'
  | 'send:static:response'

/**
 * Driver → server IPC for `cy.intercept` registration and handler round-trips.
 */
export interface InterceptRegistrationRequest {
  eventName: InterceptRegistrationEventName
  frame: NetEvent.ToServer.DriverEvent
}

/**
 * Driving port: test definition (`cy.intercept`, driver handler resolution).
 */
export interface ForInterceptRegistration {
  handleEvent (request: InterceptRegistrationRequest): Promise<unknown>
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
