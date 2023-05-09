import _ from 'lodash'
import type { IncomingMessage } from 'http'
import type { Readable } from 'stream'
import type {
  CypressIncomingRequest,
  CypressOutgoingResponse,
} from '@packages/proxy'
import type {
  NetEvent,
  Subscription,
} from '../types'
import type { BackendRoute, NetStubbingState } from './types'
import { emit, sendStaticResponse } from './util'
import type CyServer from '@packages/server'
import type { BackendStaticResponse } from '../internal-types'

export class InterceptedRequest {
  id: string
  subscriptionsByRoute: Array<{
    routeId: string
    immediateStaticResponse?: BackendStaticResponse
    subscriptions: Subscription[]
  }> = []
  includeBodyInAfterResponse: boolean = false
  responseSent: boolean = false
  lastEvent?: string
  onError: (err: Error) => void
  /**
   * A callback that can be used to make the request go outbound through the rest of the request proxy steps.
   */
  continueRequest: Function
  /**
   * Finish the current request with a response.
   */
  // TODO: do we need to adapt this?
  _onResponse: (incomingRes: IncomingMessage, resStream: Readable) => void
  /**
   * A callback that can be used to send the response through the rest of the response proxy steps.
   */
  continueResponse?: (newResStream?: Readable) => void
  req: CypressIncomingRequest
  res: CypressOutgoingResponse
  state: NetStubbingState
  socket: CyServer.Socket

  constructor (opts: Pick<InterceptedRequest, 'req' | 'res' | 'continueRequest' | 'onError' | 'onResponse' | 'state' | 'socket'>) {
    this.id = _.uniqueId('interceptedRequest')
    this.req = opts.req
    this.res = opts.res
    this.continueRequest = opts.continueRequest
    this.onError = opts.onError
    this._onResponse = opts.onResponse
    this.state = opts.state
    this.socket = opts.socket

    this.addDefaultSubscriptions()
  }

  onResponse = (incomingRes: IncomingMessage, resStream: Readable) => {
    if (this.responseSent) {
      throw new Error('onResponse cannot be called twice')
    }

    this.responseSent = true

    this._onResponse(incomingRes, resStream)
  }

  private addDefaultSubscriptions () {
    if (this.subscriptionsByRoute.length) {
      throw new Error('cannot add default subscriptions to non-empty array')
    }

    if (!this.req.matchingRoutes) {
      return
    }

    for (const route of this.req.matchingRoutes) {
      const subscriptionsByRoute = {
        routeId: route.id,
        immediateStaticResponse: route.staticResponse,
        subscriptions: [{
          eventName: 'before:request',
          await: !!route.hasInterceptor,
          routeId: route.id,
        },
        ...(['response:callback', 'after:response', 'network:error'].map((eventName) => {
          // notification-only default event
          return { eventName, await: false, routeId: route.id }
        }))],
      }

      this.subscriptionsByRoute.push(subscriptionsByRoute)
    }
  }

  static resolveEventHandler (state: NetStubbingState, options: { eventId: string, changedData: any, stopPropagation: boolean }) {
    const pendingEventHandler = state.pendingEventHandlers[options.eventId]

    if (!pendingEventHandler) {
      return
    }

    delete state.pendingEventHandlers[options.eventId]

    pendingEventHandler(options)
  }

  addSubscription (subscription: Subscription) {
    const subscriptionsByRoute = _.find(this.subscriptionsByRoute, { routeId: subscription.routeId })

    if (!subscriptionsByRoute) {
      throw new Error('expected to find existing subscriptions for route, but request did not originally match route')
    }

    // filter out any defaultSub subscriptions that are no longer needed
    const defaultSub = _.find(subscriptionsByRoute.subscriptions, ({ eventName, routeId, id, skip }) => {
      return eventName === subscription.eventName && routeId === subscription.routeId && !id && !skip
    })

    defaultSub && (defaultSub.skip = true)

    subscriptionsByRoute.subscriptions.push(subscription)
  }

  /*
   * Run all subscriptions for an event, awaiting responses if applicable.
   * Subscriptions are run in order, first sorted by matched route order, then by subscription definition order.
   * Resolves with the updated object, or the original object if no changes have been made.
   */
  async handleSubscriptions<D> ({ eventName, data, mergeChanges }: {
    eventName: string | string[]
    data: D
    /*
     * Given a `before` snapshot and an `after` snapshot, add the changes from `after` to `before`.
     */
    mergeChanges: (before: D, after: D) => void
  }): Promise<D> {
    const eventNames = Array.isArray(eventName) ? eventName : [eventName]
    let stopPropagationNow

    outerLoop: for (const eventName of eventNames) {
      this.lastEvent = eventName

      const handleSubscription = async (subscription: Subscription): Promise<void> => {
        if (subscription.skip || subscription.eventName !== eventName) {
          return
        }

        const eventId = _.uniqueId('event')
        const eventFrame: NetEvent.ToDriver.Event<any> = {
          eventId,
          subscription,
          browserRequestId: this.req.browserPreRequest && this.req.browserPreRequest.requestId,
          requestId: this.id,
          data,
        }

        // https://github.com/cypress-io/cypress/issues/17139
        // Routes should be counted before they're sent.
        if (eventName === 'before:request') {
          const route = this.req.matchingRoutes?.find(({ id }) => id === subscription.routeId) as BackendRoute

          if (!route) throw new Error(`No route by ID ${subscription.routeId} for ${eventName}`)

          route.matches++

          if (route.routeMatcher.times && route.matches >= route.routeMatcher.times) {
            route.disabled = true
          }
        }

        const _emit = () => emit(this.socket, eventName, eventFrame)

        if (!subscription.await) {
          _emit()

          return
        }

        const p = new Promise((resolve) => {
          this.state.pendingEventHandlers[eventId] = resolve
        })

        _emit()

        const { changedData, stopPropagation } = await p as any

        stopPropagationNow = stopPropagation

        if (changedData) {
          mergeChanges(data, changedData as any)
        }
      }

      for (const { subscriptions, immediateStaticResponse } of this.subscriptionsByRoute) {
        for (const subscription of subscriptions) {
          await handleSubscription(subscription)

          if (stopPropagationNow) {
            break
          }
        }

        if (eventName === 'before:request' && immediateStaticResponse) {
          // Since StaticResponse is conflated with InterceptOptions, only send an immediate response if there are keys other than `log`.
          const hasOnlyLog = _.isEqual(Object.keys(immediateStaticResponse), ['log'])

          if (!hasOnlyLog) {
            await sendStaticResponse(this, immediateStaticResponse)

            return data
          }
        }

        if (stopPropagationNow) {
          break outerLoop
        }
      }
    }

    return data
  }
}
