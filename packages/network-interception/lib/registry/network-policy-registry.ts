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
 * Default {@link ForNetworkPolicyRegistration} implementation and internal rule runner.
 *
 * Policy instances are added by `@packages/server` via the driving port at the composition root.
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
        // Intentional no-op: chain advancement is implicit via the loop below.
        // Policies call continue() for API symmetry with end(); onContinue fires
        // only when every matching policy completes without ending the chain.
      },
      end () {
        if (ended) {
          return
        }

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
        // e.g. policy when() returns false — try the next registered policy.
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
