export type ShouldLogRequestFacts = {
  matchingRoutes?: Array<{ staticResponse?: { log?: boolean } }>
  resourceType?: string
}

/**
 * Pure intercept/request logging decision — extracted from proxy `SendToDriver` middleware.
 */
export function shouldLogRequest (facts: ShouldLogRequestFacts): boolean {
  if (facts.matchingRoutes?.length) {
    const lastMatchingRoute = facts.matchingRoutes[0]

    if (!lastMatchingRoute.staticResponse) {
      return true
    }

    if (lastMatchingRoute.staticResponse.log !== undefined) {
      return Boolean(lastMatchingRoute.staticResponse.log)
    }
  }

  return facts.resourceType === 'fetch' || facts.resourceType === 'xhr'
}
