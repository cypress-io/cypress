import { NetworkPolicyRegistry } from '@packages/network-policy'
import type { ForNetworkPolicyRegistration, NetworkPolicy } from '@packages/network-policy'

/**
 * Server-side {@link ForNetworkPolicyRegistration} adapter for configurator policies.
 * Stage 2a: not wired at server startup yet.
 */
export class ConfiguratorNetworkPolicyAdapter implements ForNetworkPolicyRegistration {
  constructor (private readonly registry: NetworkPolicyRegistry = new NetworkPolicyRegistry()) {}

  add (policy: NetworkPolicy): void {
    this.registry.add(policy)
  }

  getPolicies (): ReadonlyArray<NetworkPolicy> {
    return this.registry.getPolicies()
  }

  /** Exposed for Stage 2b wiring and unit tests. */
  getRegistry (): NetworkPolicyRegistry {
    return this.registry
  }
}
