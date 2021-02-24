import { Route, Interception } from '../types'
import { NetEventFrames } from '@packages/net-stubbing/lib/types'
import { onRequestReceived } from './request-received'
import { onResponseReceived } from './response-received'
import { onRequestComplete } from './request-complete'
import Bluebird from 'bluebird'

export type HandlerFn<Frame extends NetEventFrames.BaseHttp> = (Cypress: Cypress.Cypress, frame: Frame, opts: {
  getRequest: (routeHandlerId: string, requestId: string) => Interception | undefined
  getRoute: (routeHandlerId: string) => Route | undefined
  emitNetEvent: (eventName: string, frame: any) => Promise<void>
  failCurrentTest: (err: Error) => void
}) => Promise<void> | void

const netEventHandlers: { [eventName: string]: HandlerFn<any> } = {
  'http:request:received': onRequestReceived,
  'http:response:received': onResponseReceived,
  'http:request:complete': onRequestComplete,
}

export function registerEvents (Cypress: Cypress.Cypress, cy: Cypress.cy) {
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
    cy.fail(err)
  }

  Cypress.on('test:before:run', () => {
    // wipe out callbacks, requests, and routes when tests start
    state('routes', {})
    state('aliasedRequests', [])
  })

  Cypress.on('net:event', (eventName, frame: NetEventFrames.BaseHttp) => {
    Bluebird.try(() => {
      const handler = netEventHandlers[eventName]

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
