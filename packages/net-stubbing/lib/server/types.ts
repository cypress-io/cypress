import { IncomingMessage } from 'http'
import { Readable } from 'stream'

import {
  CypressIncomingRequest,
  CypressOutgoingResponse,
} from '@packages/proxy'
import {
  RouteMatcherOptions,
  StaticResponse,
} from '../types'

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId?: string
  staticResponse?: StaticResponse
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
  req: CypressIncomingRequest
  res: CypressOutgoingResponse
  incomingRes?: IncomingMessage
  resStream?: Readable
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
