import { Route, Interception } from '../types'
import { NetEvent } from '@packages/net-stubbing/lib/types'
import { onRequestReceived } from './request-received'
import { onResponseReceived } from './response-received'
import { onRequestComplete } from './request-complete'
import Bluebird from 'bluebird'
import _ from 'lodash'

export type HandlerFn<D> = (Cypress: Cypress.Cypress, frame: NetEvent.ToDriver.Event<D>, handler: (data: D) => void | Promise<void>, opts: {
  getRequest: (routeHandlerId: string, requestId: string) => Interception | undefined
  getRoute: (routeHandlerId: string) => Route | undefined
  emitNetEvent: (eventName: string, frame: any) => Promise<void>
  failCurrentTest: (err: Error) => void
}) => Promise<D> | D

const netEventHandlers: { [eventName: string]: HandlerFn<any> } = {
  'http:request:received': onRequestReceived,
  // 'http:request:outgoing': onRequestOutgoing,
  'response': onResponseReceived,
  // 'http:response:outgoing': onResponseOutgoing,
  'http:request:complete': onRequestComplete,
}

export function registerEvents (Cypress: Cypress.Cypress) {
  const { state } = Cypress

  function getRoute (routeHandlerId) {
    return state('routes')[routeHandlerId]
  }

  function getRequest (routeHandlerId: string, requestId: string): Interception | undefined {
    const route = getRoute(routeHandlerId)

    if (route) {
      return route.requests[requestId]
    }

    return
  }

  function emitNetEvent (eventName: string, frame: any): Promise<void> {
    // all messages from driver to server are wrapped in backend:request
    return Cypress.backend('net', eventName, frame)
    .catch((err) => {
      err.message = `An error was thrown while processing a network event: ${err.message}`
      failCurrentTest(err)
    })
  }

  function failCurrentTest (err: Error) {
    // @ts-ignore
    // FIXME: asynchronous errors are not correctly attributed to spec when they come from `top`, must manually attribute
    err.fromSpec = true
    // @ts-ignore
    // FIXME: throw inside of a setImmediate so that the error does not end up as an unhandled ~rejection~, since we do not correctly handle them
    setImmediate(() => Cypress.cy.fail(err))
  }

  Cypress.on('test:before:run', () => {
    // wipe out callbacks, requests, and routes when tests start
    state('routes', {})
    state('aliasedRequests', [])
  })

  Cypress.on('net:event', (eventName, frame: NetEvent.Http) => {
    Bluebird.try(async () => {
      const handler = netEventHandlers[eventName]

      if (!handler) {
        throw new Error(`received unknown net:event in driver: ${eventName}`)
      }

      if (frame.subscriptionId) {
        const request = getRequest(frame.routeHandlerId, frame.requestId)
        const subscription = request?.subscriptions.find(({ subscription }) => {
          return subscription.id === frame.subscriptionId
        })

        const changedData = await handler(Cypress, frame, subscription.handler, {
          getRoute,
          getRequest,
          emitNetEvent,
          failCurrentTest,
        })

        return emitNetEvent('subscription:handler:resolved', {
          requestId: frame.requestId,
          routeHandlerId: frame.routeHandlerId,
          subscriptionId: frame.subscriptionId,
          changedData,
        })
      }

      return handler(Cypress, frame, {
        getRoute,
        getRequest,
        emitNetEvent,
        failCurrentTest,
      })
    })
    .catch(failCurrentTest)
  })

  return { emitNetEvent }
}
