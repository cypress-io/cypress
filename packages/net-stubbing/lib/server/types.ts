import {
  IncomingMessage,
  ServerResponse,
} from 'http'
import {
  RouteMatcherOptions,
  StaticResponse,
} from '../types'

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId?: string
  staticResponse?: StaticResponse
}

export interface ProxyIncomingMessage extends IncomingMessage {
  headers: {
    [k: string]: string
  }
  proxiedUrl: string
  webSocket: boolean // TODO: populate
  requestId: string
  body?: string
}

export interface BackendRequest {
  requestId: string
  /**
   * The route that matched this request.
   */
  route: BackendRoute
  /**
   * A callback that can be used to make the request go outbound.
   */
  continueRequest: Function
  /**
   * A callback that can be used to send the response through the proxy.
   */
  continueResponse?: Function
  req: ProxyIncomingMessage
  res: ServerResponse & { body?: string | any }
  incomingRes?: IncomingMessage
  resStream?: any
  /**
   * Should the response go to the driver, or should it be allowed to continue?
   */
  sendResponseToDriver?: boolean
}

export interface NetStubbingState {
  // map of request IDs to requests in flight
  requests: {
    [requestId: string]: BackendRequest
  }
  routes: BackendRoute[]
  reset: () => void
}
