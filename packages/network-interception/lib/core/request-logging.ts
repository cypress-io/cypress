import { debug } from '../debug'

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
      debug.core('shouldLogRequest true (matching intercept without static response)')

      // No StaticResponse is set, therefore the request must be logged.
      return true
    }

    if (lastMatchingRoute.staticResponse.log !== undefined) {
      const shouldLog = Boolean(lastMatchingRoute.staticResponse.log)

      debug.core('shouldLogRequest %s (staticResponse.log)', shouldLog)

      return shouldLog
    }
  }

  const shouldLog = facts.resourceType === 'fetch' || facts.resourceType === 'xhr'

  debug.core('shouldLogRequest %s (resourceType %s)', shouldLog, facts.resourceType ?? 'unknown')

  // 2. Otherwise, only log if it is an XHR or fetch.
  return shouldLog
}
