import _ from 'lodash'
import {
  Interception,
  Route,
} from './types'

export function isDynamicAliasingPossible (state: Cypress.State) {
  // dynamic aliasing is possible if a route with dynamic interception has been defined
  return _.find(state('routes'), (route) => {
    return _.isFunction(route.handler)
  })
}

export function getAliasedRequests (alias: string, state: Cypress.State): Interception[] {
  // Start with request-level (req.alias = '...') aliases that could be a match.
  const requests = _.filter(state('aliasedRequests'), { alias })
  .map(({ request }) => request)

  // Now add route-level (cy.intercept(...).as()) aliased requests.
  const route: Route = _.find(state('routes'), { alias })

  if (route) {
    Array.prototype.push.apply(requests, _.values(route.requests))
  }

  return requests
}
