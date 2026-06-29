import type { Route, Interception, StaticResponse, NetEvent } from '../types'
import { onBeforeRequest } from './before-request'
import { onResponse } from './response'
import { onAfterResponse } from './after-response'
import { onNetworkError } from './network-error'
import Bluebird from 'bluebird'
import { getBackendStaticResponse } from '../static-response-utils'

export type HandlerResult<D> = {
  changedData: D
  stopPropagation?: boolean
} | null

export type HandlerFn<D> = (Cypress: Cypress.Cypress, frame: NetEvent.ToDriver.Event<D>, userHandler: (data: D) => void | Promise<void>, opts: {
  getRequest: (routeId: string, requestId: string) => Interception | undefined
  getRoute: (routeId: string) => Route | undefined
  emitNetEvent: (eventName: string, frame: any) => Promise<void>
  sendStaticResponse: (requestId: string, staticResponse: StaticResponse) => void
}) => Promise<HandlerResult<D>> | HandlerResult<D>

const netEventHandlers: { [eventName: string]: HandlerFn<any> } = {
  'before:request': onBeforeRequest,
  'before:response': onResponse,
  'response:callback': onResponse,
  'response': onResponse,
  'after:response': onAfterResponse,
  'network:error': onNetworkError,
}

export function registerEvents (Cypress: Cypress.Cypress, cy: Cypress.cy) {
  const { state } = Cypress

  function getRoute (routeId) {
    const routes = state('routes') || {}

    return routes[routeId]
  }

  function getRequest (routeId: string, requestId: string): Interception | undefined {
    const route = getRoute(routeId)

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

  function sendStaticResponse (requestId: string, staticResponse: StaticResponse) {
    // tslint:disable:no-floating-promises
    emitNetEvent('send:static:response', {
      requestId,
      staticResponse: getBackendStaticResponse(staticResponse),
    })
  }

  function failCurrentTest (err: Error) {
    // @ts-ignore
    cy.fail(err, { async: true })
  }

  Cypress.on('test:before:run', () => {
    // wipe out callbacks, requests, and routes when tests start
    state('routes', {})
    state('aliasedRequests', [])
  })

  Cypress.on('net:stubbing:event', (eventName, frame: NetEvent.ToDriver.Event<any>) => {
    Bluebird.try(async () => {
      const handler = netEventHandlers[eventName]

      if (!handler) {
        throw new Error(`received unknown net:stubbing:event in driver: ${eventName}`)
      }

      const emitResolved = (result: HandlerResult<any>) => {
        return emitNetEvent('event:handler:resolved', {
          eventId: frame.eventId,
          ...result,
        })
      }

      const route = getRoute(frame.subscription.routeId)

      if (!route) {
        if (frame.subscription.await) {
          // route not found, just resolve so the request can continue
          // tslint:disable:no-floating-promises
          emitResolved(frame.data)
        }

        return
      }

      const getUserHandler = () => {
        if (eventName === 'before:request' && !frame.subscription.id) {
          // users can not explicitly subscribe to the first `before:request` event (req handler)
          return route && route.handler
        }

        const request = getRequest(frame.subscription.routeId, frame.requestId)

        const subscription = request && request.subscriptions.find(({ subscription }) => {
          return subscription.id === frame.subscription.id
        })

        return subscription && subscription.handler
      }

      const userHandler = getUserHandler()

      if (frame.subscription.await && !userHandler) {
        throw new Error('event is waiting for a response, but no user handler was found')
      }

      const result = await handler(Cypress, frame, userHandler, {
        getRoute,
        getRequest,
        emitNetEvent,
        sendStaticResponse,
      })

      if (!frame.subscription.await) {
        return
      }

      return emitResolved(result)
    })
    .catch(failCurrentTest)
  })

  return { emitNetEvent }
}
