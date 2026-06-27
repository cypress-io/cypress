export type ShouldLogRequestFacts = {
  matchingRoutes?: Array<{ log?: boolean, staticResponse?: { log?: boolean } }>
  resourceType?: string
}

/**
 * Pure intercept/request logging decision — extracted from proxy `SendToDriver` middleware.
 */
export function shouldLogRequest (facts: ShouldLogRequestFacts): boolean {
  // 1. Any matching `cy.intercept()` should cause `req` to be logged by default, unless `log: false` is passed explicitly.
  if (facts.matchingRoutes?.length) {
    const lastMatchingRoute = facts.matchingRoutes[0]

    // An explicit `log` option on the route matcher (`cy.intercept({ log: false })`)
    // or the static response (`cy.intercept(url, { log: false })`) takes precedence
    // and applies whether or not the request is stubbed.
    const log = lastMatchingRoute.log ?? lastMatchingRoute.staticResponse?.log

    if (log !== undefined) {
      return Boolean(log)
    }

    if (!lastMatchingRoute.staticResponse) {
      // No StaticResponse is set, therefore the request must be logged.
      return true
    }
  }

  // 2. Otherwise, only log if it is an XHR or fetch.
  return facts.resourceType === 'fetch' || facts.resourceType === 'xhr'
}
