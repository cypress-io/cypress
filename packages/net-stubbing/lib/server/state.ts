import { noop } from 'lodash'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    reset () {
      // Clean up requests that are still pending when a test ends.
      //
      // Requests that still depend on a driver-side interceptor callback cannot
      // be resolved once their defining test has ended, so they are destroyed.
      // Requests that resolve without a callback (static responses, spies) are
      // left to finish on their own — destroying them aborts the response, which
      // causes the browser to retry the request and bleed it into the next test.
      // https://github.com/cypress-io/cypress/issues/20397
      for (const requestId in this.requests) {
        const request = this.requests[requestId]

        if (!request.requiresInterceptorCallback()) {
          continue
        }

        const { res } = request

        res.removeAllListeners('finish')
        res.removeAllListeners('error')
        res.on('error', noop)
        res.destroy()
      }

      this.pendingEventHandlers = {}
      this.requests = {}
      this.routes = []
    },
  }
}
