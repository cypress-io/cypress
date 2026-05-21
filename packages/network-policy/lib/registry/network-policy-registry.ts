import type { ForNetworkPolicyRegistration } from '../ports/driving-ports'
import type { NetworkExchange } from '../exchange/network-exchange'
import type { NetworkPolicy, PolicyContext, PolicyPhase } from '../policies/types'

export type RunPoliciesOptions = {
  phase: PolicyPhase
  exchange: NetworkExchange
  onContinue: () => void
  onEnd: () => void
}

/**
 * In-memory registry for configurator {@link NetworkPolicy} instances.
 */
export class NetworkPolicyRegistry implements ForNetworkPolicyRegistration {
  private readonly policies: NetworkPolicy[] = []

  add (policy: NetworkPolicy): void {
    this.policies.push(policy)
  }

  getPolicies (): ReadonlyArray<NetworkPolicy> {
    return this.policies
  }

  /**
   * Run registered policies for a phase. First matching policy that calls `end()` stops the chain.
   * Not wired into proxy middleware until Stage 2b+.
   */
  async runPolicies (options: RunPoliciesOptions): Promise<void> {
    const { phase, exchange, onContinue, onEnd } = options
    let ended = false

    const ctx: PolicyContext = {
      phase,
      exchange,
      continue () {
        // no-op — chain continues to next policy
      },
      end () {
        ended = true
        onEnd()
      },
    }

    for (const policy of this.policies) {
      if (ended) {
        break
      }

      if (!policy.phases.includes(phase)) {
        continue
      }

      if (!policy.when(exchange)) {
        continue
      }

      await policy.apply(ctx)

      if (ended) {
        return
      }
    }

    if (!ended) {
      onContinue()
    }
  }
}
