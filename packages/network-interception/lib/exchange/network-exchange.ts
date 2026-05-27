/**
 * Normalized request/response snapshot passed from adapters to NetworkPolicyCore.
 * Fields grow in Stage 3a/3b.
 */
export interface NetworkExchange {
  requestId?: string
  url?: string
  method?: string
}
