import type { NetEvent } from '../types'
import type { NetworkPolicy } from '../policies/types'

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
 * Driving port: composition root registers configurator policies (blockHosts, CSP, rewrites).
 *
 * Implemented by {@link NetworkPolicyRegistry}. `@packages/server` calls `add()` at startup;
 * policy definitions and config mapping live in server, not inside network-interception.
 */
export interface ForNetworkPolicyRegistration {
  add (policy: NetworkPolicy): void
  getPolicies (): ReadonlyArray<NetworkPolicy>
}
