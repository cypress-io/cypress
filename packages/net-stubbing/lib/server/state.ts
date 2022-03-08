import type { InterceptedRequest } from './intercepted-request'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    async reset () {
      console.log('resetting', Object.keys(this.requests))
      await Promise.all(Object.values <InterceptedRequest>(this.requests).map((request) => {
        const responseEvents = ['before:response', 'response:callback', 'response']
        const inResponsePhase = responseEvents.includes(request.lastEvent!)
        const { res } = request

        if (res.destroyed) {
          console.log('already destroyed')

          return Promise.resolve()
        }

        let shouldDestroyResponse = false

        request.subscriptionsByRoute.forEach((subscriptionByRoute) => {
          if (!subscriptionByRoute.immediateStaticResponse) {
            subscriptionByRoute.subscriptions.forEach((subscription) => {
              if (subscription.await && !subscription.skip && (responseEvents.includes(subscription.eventName) || !inResponsePhase)) {
                console.log('Destroying due to', subscription)
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
              console.log('finished')
              res.destroy()
              resolve()
            })

            res.once('error', () => {
              console.log('errored')
              res.destroy()
              resolve()
            })

            res.end()
          })
        }

        console.log('not destroyed')

        return Promise.resolve()
      }))

      this.pendingEventHandlers = {}
      this.requests = {}
      this.routes = []
    },
  }
}
