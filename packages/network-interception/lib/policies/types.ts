import type { NetworkExchange } from '../exchange/network-exchange'

export type { NetworkExchange } from '../exchange/network-exchange'

export type PolicyProvenance = 'config' | 'test'

export type PolicyPhase = 'request' | 'response' | 'error'

export interface PolicyContext {
  phase: PolicyPhase
  exchange: NetworkExchange
  continue (): void
  end (): void
}

export type PolicyPredicate = (exchange: NetworkExchange) => boolean

export type PolicyHandler = (ctx: PolicyContext) => void | Promise<void>

export interface NetworkPolicy {
  name: string
  provenance: PolicyProvenance
  phases: PolicyPhase[]
  when: PolicyPredicate
  apply: PolicyHandler
}
