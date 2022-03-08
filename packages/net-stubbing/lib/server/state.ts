import type { InterceptedRequest } from './intercepted-request'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    async reset () {
      await Promise.all(Object.values <InterceptedRequest>(this.requests).map((request) => {
        const responseEvents = ['before:response', 'response:callback', 'response', 'network:error']
        const inResponsePhase = responseEvents.includes(request.lastEvent!)
        const { res } = request

        if (res.destroyed) {
          delete this.requests[request.id]

          return Promise.resolve()
        }

        let shouldDestroyResponse = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              if (subscription.await && !subscription.skip && (responseEvents.includes(subscription.eventName) || !inResponsePhase)) {
                shouldDestroyResponse = true
              }
            })
          }
        })

        if (shouldDestroyResponse) {
          res.removeAllListeners('finish')
          res.removeAllListeners('error')

          return new Promise<void>((resolve) => {
            res.once('finish', () => {
              res.destroy()
              delete this.requests[request.id]
              resolve()
            })

            res.once('error', () => {
              res.destroy()
              delete this.requests[request.id]
              resolve()
            })

            res.end()
          })
        }

        return Promise.resolve()
      }))

      this.pendingEventHandlers = {}
      this.routes = []
    },
  }
}
