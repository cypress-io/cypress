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
        const inResponsePhase = ['before:response', 'response:callback', 'response'].includes(request.lastEvent!)

        let shouldDestroyResponse = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              if (subscription.await && !subscription.skip && (subscription.eventName === 'response:callback' || !inResponsePhase)) {
                shouldDestroyResponse = true
              }
            })
          }
        })

        if (shouldDestroyResponse) {
          const { res } = request

          res.removeAllListeners('finish')
          res.removeAllListeners('error')
          res.on('error', noop)
          res.end()
          res.destroy()
        }
      }

      this.pendingEventHandlers = {}
      this.requests = {}
      this.routes = []
    },
  }
}
