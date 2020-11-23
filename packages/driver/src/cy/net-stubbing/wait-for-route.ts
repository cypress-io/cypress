import _ from 'lodash'
import {
  Interception,
  Route,
  InterceptionState,
} from './types'

const RESPONSE_WAITED_STATES: InterceptionState[] = ['ResponseIntercepted', 'Complete']

function getPredicateForSpecifier (specifier: string): Partial<Interception> {
  if (specifier === 'request') {
    return { requestWaited: false }
  }

  // default to waiting on response
  return { responseWaited: false }
}

export function waitForRoute (alias: string, state: Cypress.State, specifier: 'request' | 'response' | string): Interception | null {
  // 1. Create an array of known requests that have this alias.
  // Start with request-level (req.alias = '...') aliases that could be a match.
  const candidateRequests = _.filter(state('aliasedRequests'), { alias })
  .map(({ request }) => request)

  // Now add route-level (cy.intercept(...).as()) aliased requests.
  const route: Route = _.find(state('routes'), { alias })

  if (route) {
    Array.prototype.push.apply(candidateRequests, _.values(route.requests))
  }

  // 2. Find the first request without responseWaited/requestWaited
  const predicate = getPredicateForSpecifier(specifier)
  const request = _.find(candidateRequests, predicate) as Interception | undefined

  if (!request) {
    return null
  }

  // 3. Determine if it's ready based on the specifier
  request.requestWaited = true
  if (specifier === 'request') {
    return request
  }

  if (RESPONSE_WAITED_STATES.includes(request.state)) {
    request.responseWaited = true

    return request
  }

  return null
}
