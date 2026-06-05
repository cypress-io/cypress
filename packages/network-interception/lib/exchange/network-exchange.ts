/**
 * Normalized request/response snapshot passed from adapters to NetworkInterceptionCore.
 */
export interface NetworkExchange {
  requestId?: string
  url?: string
  method?: string
}
