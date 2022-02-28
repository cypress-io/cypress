import { noop } from 'lodash'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    reset () {
      // clean up requests that are still pending
      for (const requestId in this.requests) {
        const request = this.requests[requestId]

        request.matchingRoutes = request.matchingRoutes.filter((route) => {
          console.log(route)

          return !!route.staticResponse || !route.hasInterceptor
        })

        if (request.matchingRoutes.length === 0) {
          const res = request.res

          res.removeAllListeners('finish')
          res.removeAllListeners('error')
          res.on('error', noop)
          res.destroy()
        } else {
          console.log('Not destroying everything')
        }
      }

      this.pendingEventHandlers = {}
      this.requests = {}
      this.routes = []
    },
  }
}
