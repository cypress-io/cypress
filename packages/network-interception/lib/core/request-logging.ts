export type ShouldLogRequestFacts = {
  matchingRoutes?: Array<{ staticResponse?: { log?: boolean } }>
  resourceType?: string
}

/**
 * Pure intercept/request logging decision — extracted from proxy `SendToDriver` middleware.
 */
export function shouldLogRequest (facts: ShouldLogRequestFacts): boolean {
  // 1. Any matching `cy.intercept()` should cause `req` to be logged by default, unless `log: false` is passed explicitly.
  if (facts.matchingRoutes?.length) {
    const lastMatchingRoute = facts.matchingRoutes[0]

    if (!lastMatchingRoute.staticResponse) {
      // No StaticResponse is set, therefore the request must be logged.
      return true
    }

    if (lastMatchingRoute.staticResponse.log !== undefined) {
      return Boolean(lastMatchingRoute.staticResponse.log)
    }
  }

  // 2. Otherwise, only log if it is an XHR or fetch.
  return facts.resourceType === 'fetch' || facts.resourceType === 'xhr'
}
