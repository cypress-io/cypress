import type {
  Interception,
} from './types'
import type { StateFunc } from '../../cypress/state'

export function isDynamicAliasingPossible (state: StateFunc) {
  // dynamic aliasing is possible if a route with dynamic interception has been defined
  return Object.values(state('routes') || {}).find((route) => {
    return typeof route.handler === 'function'
  })
}

export function getAliasedRequests (alias: string, state: StateFunc): Interception[] {
  // Start with request-level (req.alias = '...') aliases that could be a match.
  const requests = (state('aliasedRequests') || []).filter((r) => r.alias === alias)
  .map(({ request }) => request)

  // Now add route-level (cy.intercept(...).as()) aliased requests.
  const routes = Object.values(state('routes') || {}).filter((r: any) => r.alias === alias)

  for (const route of routes) {
    Array.prototype.push.apply(requests, Object.values((route as any).requests))
  }

  return requests
}
