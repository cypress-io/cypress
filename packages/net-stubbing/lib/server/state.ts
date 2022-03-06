import { noop } from 'lodash'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    reset () {
      for (const requestId in this.requests) {
        const request = this.requests[requestId]
        const inResponsePhase = ['before:response', 'response:callback', 'response'].includes(request.lastEvent!)

        let shouldDestroyResponse = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              console.log(subscription)
              if (subscription.await && !subscription.skip && (subscription.eventName === 'response:callback' || !inResponsePhase)) {
                console.log('Destroying')
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
