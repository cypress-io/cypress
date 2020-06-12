import _ from 'lodash'
import {
  Request,
  Route,
  RequestState,
} from './types'

const RESPONSE_WAITED_STATES: RequestState[] = ['ResponseIntercepted', 'Complete']

export function waitForRoute (alias: string, state: Cypress.State, specifier: 'request' | 'response' | string): Request | null {
  // if they didn't specify what to wait on, they want to wait on a response
  if (!specifier) {
    specifier = 'response'
  }

  // 1. Get route with this alias.
  const route: Route = _.find(state('routes'), { alias })

  if (!route) {
    // TODO: once XHR stubbing is removed, this should throw
    return null
  }

  // 2. Find the first request without responseWaited/requestWaited/with the correct index
  let i = 0
  const request = _.find(route.requests, (request) => {
    i++
    switch (specifier) {
      case 'request':
        return !request.requestWaited
      case 'response':
        return !request.responseWaited
      default:
        return i === Number(specifier)
    }
  })

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
