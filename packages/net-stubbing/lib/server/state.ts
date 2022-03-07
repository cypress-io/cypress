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
        const responseEvents = ['before:response', 'response:callback', 'response']
        const inResponsePhase = responseEvents.includes(request.lastEvent!)

        let shouldDestroyResponse = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              console.log(subscription)
              if (subscription.await && !subscription.skip && (responseEvents.includes(subscription.eventName) || !inResponsePhase)) {
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
