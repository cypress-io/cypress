import {
  CyHttpMessages,
  RouteHandler,
  RouteMatcherOptions,
  HttpResponseInterceptor,
} from '../types'

declare global {
  namespace Cypress {
    interface State {
      (k: 'routes', v?: RouteMap): RouteMap
    }
  }
}

export interface Route {
  alias?: string
  log: Cypress.Log
  options: RouteMatcherOptions
  handler: RouteHandler
  hitCount: number
  requests: { [key: string]: Request }
}

export type RouteMap = { [key: string]: Route }

export interface Request {
  req: CyHttpMessages.IncomingRequest
  responseHandler?: HttpResponseInterceptor
  state: RequestState
  log: Cypress.Log
  requestWaited: boolean
  responseWaited: boolean
}

export enum RequestState {
  Received,
  Intercepted,
  ResponseReceived,
  ResponseIntercepted,
  Completed
}
