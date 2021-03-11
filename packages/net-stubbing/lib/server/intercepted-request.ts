import _ from 'lodash'
import { IncomingMessage } from 'http'
import { Readable } from 'stream'
import {
  CypressIncomingRequest,
  CypressOutgoingResponse,
} from '@packages/proxy'
import {
  NetEvent,
  Subscription,
} from '../types'
import { BackendRoute, NetStubbingState } from './types'
import { emit } from './util'
import CyServer from '@packages/server'

export class InterceptedRequest {
  id: string
  subscriptionsByRoute: Array<{
    routeHandlerId: string
    subscriptions: Subscription[]
  }>
  onError: (err: Error) => void
  /**
   * A callback that can be used to make the request go outbound through the rest of the request proxy steps.
   */
  continueRequest: Function
  /**
   * Finish the current request with a response.
   */
  onResponse: (incomingRes: IncomingMessage, resStream: Readable) => void
  /**
   * A callback that can be used to send the response through the rest of the response proxy steps.
   */
  continueResponse?: (newResStream?: Readable) => void
  req: CypressIncomingRequest
  res: CypressOutgoingResponse
  incomingRes?: IncomingMessage
  matchingRoutes: BackendRoute[]
  state: NetStubbingState
  socket: CyServer.Socket

  constructor (opts: Pick<InterceptedRequest, 'req' | 'res' | 'continueRequest' | 'onError' | 'onResponse' | 'state' | 'socket' | 'matchingRoutes'>) {
    this.id = _.uniqueId('interceptedRequest')
    this.subscriptionsByRoute = []
    this.req = opts.req
    this.res = opts.res
    this.continueRequest = opts.continueRequest
    this.onError = opts.onError
    this.onResponse = opts.onResponse
    this.matchingRoutes = opts.matchingRoutes
    this.state = opts.state
    this.socket = opts.socket

    this.addDefaultSubscriptions()
  }

  private addDefaultSubscriptions () {
    if (this.subscriptionsByRoute.length) {
      throw new Error('cannot add default subscriptions to non-empty array')
    }

    for (const route of this.matchingRoutes) {
      const subscriptionsByRoute = {
        routeHandlerId: route.handlerId,
        subscriptions: [{
          eventName: 'before:request',
          // req.reply callback?
          await: !!route.hasInterceptor,
          routeHandlerId: route.handlerId,
        }, {
          eventName: 'before:response',
          // notification-only
          await: false,
          routeHandlerId: route.handlerId,
        }, {
          eventName: 'after:response',
          // notification-only
          await: false,
          routeHandlerId: route.handlerId,
        }],
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
    const subscriptionsByRoute = _.find(this.subscriptionsByRoute, { routeHandlerId: subscription.routeHandlerId })

    if (!subscriptionsByRoute) {
      throw new Error('expected to find existing subscriptions for route, but request did not originally match route')
    }

    // filter out any defaultSub subscriptions that are no longer needed
    const defaultSub = _.find(subscriptionsByRoute.subscriptions, ({ eventName, routeHandlerId, id, skip }) => {
      return eventName === subscription.eventName && routeHandlerId === subscription.routeHandlerId && !id && !skip
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
    eventName: string
    data: D
    /*
     * Given a `before` snapshot and an `after` snapshot, add the changes from `after` to `before`.
     */
    mergeChanges: (before: D, after: D) => void
  }): Promise<D> {
    let stopPropagationNow

    const handleSubscription = async (subscription: Subscription): Promise<void> => {
      if (subscription.skip || subscription.eventName !== eventName) {
        return
      }

      const eventId = _.uniqueId('event')
      const eventFrame: NetEvent.ToDriver.Event<any> = {
        eventId,
        subscription,
        requestId: this.id,
        routeHandlerId: subscription.routeHandlerId,
        data,
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

    outerLoop: for (const subscriptionsByRoute of this.subscriptionsByRoute) {
      for (const subscription of subscriptionsByRoute.subscriptions) {
        await handleSubscription(subscription)

        if (stopPropagationNow) {
          break outerLoop
        }
      }
    }

    return data
  }
}
