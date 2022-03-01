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

        let foundQualifiedResponseHandler = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              if ((subscription.eventName === 'response:callback' && subscription.await && !subscription.skip) ||
                  !['before:response', 'response:callback', 'response'].includes(request.lastEvent!)) {
                foundQualifiedResponseHandler = true
              }
            })
          }
        })

        if (foundQualifiedResponseHandler) {
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
