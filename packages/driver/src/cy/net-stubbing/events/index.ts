import { Route, Interception } from '../types'
import { NetEvent } from '@packages/net-stubbing/lib/types'
import { onRequestReceived } from './request-received'
import { onResponseReceived } from './response-received'
import { onRequestComplete } from './request-complete'
import Bluebird from 'bluebird'

export type HandlerFn<D> = (Cypress: Cypress.Cypress, frame: NetEvent.ToDriver.Event<D>, userHandler: (data: D) => void | Promise<void>, opts: {
  getRequest: (routeHandlerId: string, requestId: string) => Interception | undefined
  getRoute: (routeHandlerId: string) => Route | undefined
  emitNetEvent: (eventName: string, frame: any) => Promise<void>
  failCurrentTest: (err: Error) => void
}) => Promise<D> | D

const netEventHandlers: { [eventName: string]: HandlerFn<any> } = {
  'before:request': onRequestReceived,
  'response': onResponseReceived,
  'after:response': onRequestComplete,
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

  Cypress.on('net:event', (eventName, frame: NetEvent.ToDriver.Event<any>) => {
    Bluebird.try(async () => {
      const handler = netEventHandlers[eventName]

      if (!handler) {
        throw new Error(`received unknown net:event in driver: ${eventName}`)
      }

      const emitResolved = (changedData: any) => {
        return emitNetEvent('event:handler:resolved', {
          eventId: frame.eventId,
          changedData,
        })
      }

      const route = getRoute(frame.routeHandlerId)

      if (!route) {
        if (frame.subscription.await) {
          // route not found, just resolve so the request can continue
          emitResolved(frame.data)
        }

        return
      }

      const getUserHandler = () => {
        if (eventName === 'before:request' && !frame.subscription.id) {
          return route && route.handler
        }

        const request = getRequest(frame.routeHandlerId, frame.requestId)

        const subscription = request && request.subscriptions.find(({ subscription }) => {
          return subscription.id === frame.subscription.id
        })

        return subscription && subscription.handler
      }

      const userHandler = getUserHandler()

      const changedData = await handler(Cypress, frame, userHandler, {
        getRoute,
        getRequest,
        emitNetEvent,
        failCurrentTest,
      })

      if (!frame.subscription.await) {
        return
      }

      return emitResolved(changedData)
    })
    .catch(failCurrentTest)
  })

  return { emitNetEvent }
}
