import _ from 'lodash'
import {
  RequestState,
} from './types'

export function waitForRoute (alias: string, cy: Cypress.cy, state: Cypress.State, specifier: 'request' | 'response' | string, options: any) {
  // if they didn't specify what to wait on, they want to wait on a response
  if (!specifier) {
    specifier = 'response'
  }

  if (!/\d+|request|response/.test(specifier)) {
    throw new Error('bad specifier')
    // TODO: throw good error
  }

  // 1. Get route with this alias.
  // @ts-ignore
  const route : Route = _.find(state('routes'), { alias })

  function retry () {
    return cy.retry(() => {
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
        return retry()
      }

      // 3. Determine if it's ready based on the specifier
      if (request.state >= RequestState.Intercepted) {
        request.requestWaited = true
        if (specifier === 'request') {
          return Promise.resolve(request)
        }
      }

      if (request.state >= RequestState.ResponseIntercepted) {
        request.responseWaited = true

        return Promise.resolve(request)
      }

      return retry()
    }, options)
  }

  return retry()
}
