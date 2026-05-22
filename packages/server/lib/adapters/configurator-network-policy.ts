import { NetworkPolicyRegistry } from '@packages/network-interception'
import type {
  ForNetworkPolicyRegistration,
  NetworkPolicy,
  RunPoliciesOptions,
  RunPoliciesResult,
} from '@packages/network-interception'

/**
 * Server-side {@link ForNetworkPolicyRegistration} adapter for configurator policies.
 */
export class ConfiguratorNetworkPolicyAdapter implements ForNetworkPolicyRegistration {
  constructor (private readonly registry: NetworkPolicyRegistry = new NetworkPolicyRegistry()) {}

  add (policy: NetworkPolicy): void {
    this.registry.add(policy)
  }

  getPolicies (): ReadonlyArray<NetworkPolicy> {
    return this.registry.getPolicies()
  }

  /** Exposed for policy registry access and unit tests. */
  getRegistry (): NetworkPolicyRegistry {
    return this.registry
  }

  runPolicies (options: RunPoliciesOptions): Promise<RunPoliciesResult> {
    return this.registry.runPolicies(options)
  }
}
