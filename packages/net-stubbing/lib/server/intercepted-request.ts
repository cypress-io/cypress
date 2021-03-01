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
import { NetStubbingState } from './types'
import { emit } from './util'
import CyServer from '@packages/server'

export class InterceptedRequest {
  id: string
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
  subscriptions: Subscription[]
  state: NetStubbingState
  socket: CyServer.Socket

  constructor (opts: Pick<InterceptedRequest, 'req' | 'res' | 'continueRequest' | 'onError' | 'onResponse' | 'subscriptions' | 'state' | 'socket'>) {
    this.id = _.uniqueId('interceptedRequest')
    this.req = opts.req
    this.res = opts.res
    this.continueRequest = opts.continueRequest
    this.onError = opts.onError
    this.onResponse = opts.onResponse
    this.subscriptions = opts.subscriptions
    this.state = opts.state
    this.socket = opts.socket
  }

  /*
   * Run all subscriptions for an event in order, awaiting responses if applicable.
   * Resolves with the updated object, or the original object if no changes have been made.
   */
  async handleSubscriptions<D> ({ eventName, data, mergeChanges }: {
    eventName: string
    data: D
    /*
     * Given a `before` snapshot and an `after` snapshot, calculate the modified object.
     */
    mergeChanges: (before: D, after: D) => D
  }): Promise<D> {
    const handleSubscription = async (subscription: Subscription) => {
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

        return data
      }

      const p = new Promise((resolve) => {
        this.state.pendingEventHandlers[eventId] = resolve
      })

      _emit()

      const changedData = await p

      return mergeChanges(data, changedData as any)
    }

    let lastI = -1

    const getNextSubscription = () => {
      return _.find(this.subscriptions, (v, i) => {
        if (i > lastI && v.eventName === eventName) {
          lastI = i

          return v
        }

        return
      }) as Subscription | undefined
    }

    let subscription: Subscription | undefined

    while ((subscription = getNextSubscription())) {
      data = await handleSubscription(subscription)
    }

    return data
  }
}
