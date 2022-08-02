import _ from 'lodash'
import type {
  Interception,
} from './types'
import type { StateFunc } from '../../cypress/state'

export function isDynamicAliasingPossible (state: StateFunc) {
  // dynamic aliasing is possible if a route with dynamic interception has been defined
  return _.find(state('routes'), (route) => {
    return _.isFunction(route.handler)
  })
}

export function getAliasedRequests (alias: string, state: StateFunc): Interception[] {
  // Start with request-level (req.alias = '...') aliases that could be a match.
  const requests = _.filter(state('aliasedRequests'), { alias })
  .map(({ request }) => request)

  // Now add route-level (cy.intercept(...).as()) aliased requests.
  const routes = _.filter(_.values(state('routes')), { alias })

  for (const route of routes) {
    Array.prototype.push.apply(requests, _.values(route.requests))
  }

  return requests
}
