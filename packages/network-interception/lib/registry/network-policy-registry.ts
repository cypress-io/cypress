import type { ForNetworkPolicyRegistration } from '../ports/driving-ports'
import type { NetworkExchange } from '../exchange/network-exchange'
import type { NetworkPolicy, PolicyContext, PolicyPhase } from '../policies/types'

export type RunPoliciesResult = {
  ended: boolean
  state: Record<string, unknown>
}

export type RunPoliciesOptions = {
  phase: PolicyPhase
  exchange: NetworkExchange
  onContinue?: () => void
  onEnd?: () => void
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
   */
  async runPolicies (options: RunPoliciesOptions): Promise<RunPoliciesResult> {
    const { phase, exchange, onContinue, onEnd } = options
    let ended = false
    const state: Record<string, unknown> = {}

    const ctx: PolicyContext = {
      phase,
      exchange,
      state,
      continue () {
        // no-op — chain continues to next policy
      },
      end () {
        ended = true
        onEnd?.()
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
        return { ended: true, state }
      }
    }

    if (!ended) {
      onContinue?.()
    }

    return { ended, state }
  }
}
