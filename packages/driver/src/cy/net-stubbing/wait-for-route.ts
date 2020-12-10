import _ from 'lodash'
import {
  Interception,
  InterceptionState,
} from './types'
import { getAliasedRequests } from './aliasing'

const RESPONSE_WAITED_STATES: InterceptionState[] = ['ResponseIntercepted', 'Complete', 'Errored']

function getPredicateForSpecifier (specifier: string): Partial<Interception> {
  if (specifier === 'request') {
    return { requestWaited: false }
  }

  // default to waiting on response
  return { responseWaited: false }
}

export function waitForRoute (alias: string, state: Cypress.State, specifier: 'request' | 'response' | string): Interception | null {
  // 1. Create an array of known requests that have this alias.
  const candidateRequests = getAliasedRequests(alias, state)

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
