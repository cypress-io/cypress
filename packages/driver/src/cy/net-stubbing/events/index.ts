import { Route, Request } from '../types'
import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { onRequestReceived } from './request-received'
import { onResponseReceived } from './response-received'
import { onRequestComplete } from './request-complete'

export type HandlerFn<Frame extends NetEventFrames.BaseHttp> = (Cypress: Cypress.Cypress, frame: Frame, opts: {
  getRequest: (routeHandlerId: string, requestId: string) => Request | undefined
  getRoute: (routeHandlerId: string) => Route | undefined
  emitNetEvent: (eventName: string, frame: any) => Promise<void>
}) => void | Promise<void>

export function registerEvents (Cypress: Cypress.Cypress) {
  const { state } = Cypress

  function getRoute (routeHandlerId) {
    return state('routes')[routeHandlerId]
  }

  function getRequest (routeHandlerId: string, requestId: string): Request | undefined {
    const route = getRoute(routeHandlerId)

    if (route) {
      return route.requests[requestId]
    }

    return
  }

  function emitNetEvent (eventName: string, frame: any): Promise<void> {
    // all messages from driver to server are wrapped in backend:request
    return Cypress.backend('net', eventName, frame)
  }

  Cypress.on('test:before:run', () => {
    // wipe out callbacks, requests, and routes when tests start
    state('routes', {})
  })

  const netEventHandlers = {
    'http:request:received': onRequestReceived,
    'http:response:received': onResponseReceived,
    'http:request:complete': onRequestComplete,
  }

  Cypress.on('net:event', (eventName, frame: NetEventFrames.BaseHttp) => {
    try {
      const handler: HandlerFn<any> = netEventHandlers[eventName]

      handler(Cypress, frame, {
        getRoute,
        getRequest,
        emitNetEvent,
      })
    } catch (err) {
      // errors have to be manually propagated here
      // @ts-ignore
      Cypress.action('cy:fail', err, state('runnable'))
    }
  })

  return { emitNetEvent }
}
