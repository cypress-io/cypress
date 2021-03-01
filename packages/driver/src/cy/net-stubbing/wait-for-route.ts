import {
  Interception,
  InterceptionState,
} from './types'
import { getAliasedRequests } from './aliasing'

const RESPONSE_WAITED_STATES: InterceptionState[] = ['ResponseIntercepted', 'Complete', 'Errored']

export function waitForRoute (alias: string, state: Cypress.State, specifier: 'request' | 'response' | string): Interception | null {
  // 1. Create an array of known requests that have this alias.
  const candidateRequests = getAliasedRequests(alias, state)

  // 2. Find the requests without responseWaited/requestWaited
  // We should not find only the first interception here,
  // because there can be a list of interceptions with meaningful result
  // when user calls xhr.abort();
  // @see https://github.com/cypress-io/cypress/issues/9549
  const requests = candidateRequests.filter((r) => {
    if (specifier === 'request') {
      return r.requestWaited === false
    }

    return r.responseWaited === false
  })

  if (requests.length === 0) {
    return null
  }

  // 3. Determine if it's ready based on the specifier
  // When request, return the first request.
  if (specifier === 'request') {
    requests[0].requestWaited = true

    return requests[0]
  }

  // When response, return the first request that has the wanted state.
  for (let i = 0; i < requests.length; i++) {
    const request = requests[i]

    if (RESPONSE_WAITED_STATES.includes(request.state)) {
      request.requestWaited = true
      request.responseWaited = true

      return request
    }
  }

  return null
}
