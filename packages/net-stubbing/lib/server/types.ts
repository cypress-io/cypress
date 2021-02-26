import { IncomingMessage } from 'http'
import { Readable } from 'stream'
import {
  CypressIncomingRequest,
  CypressOutgoingResponse,
} from '@packages/proxy'
import {
  RouteMatcherOptions,
  BackendStaticResponse,
  Subscription,
} from '../types'

export type GetFixtureFn = (path: string, opts?: { encoding?: string | null }) => Promise<any>

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId?: string
  hasInterceptor: boolean
  staticResponse?: BackendStaticResponse
  getFixture: GetFixtureFn
}

export interface BackendRequest {
  requestId: string
  onError: (err: Error) => void
  /**
   * A callback that can be used to make the request go outbound.
   */
  continueRequest: Function
  /**
   * A callback that can be used to send the response through the proxy.
   */
  continueResponse?: (newResStream?: Readable) => void
  onResponse?: (incomingRes: IncomingMessage, resStream: Readable) => void
  req: CypressIncomingRequest
  res: CypressOutgoingResponse
  incomingRes?: IncomingMessage
  subscriptions: Subscription[]
  handleSubscriptions: <D>(opts: {
    eventName: string
    data: D
    mergeChanges: (before: D, after: D) => D
  }) => Promise<D>
}

export interface NetStubbingState {
  pendingEventHandlers: {
    [eventId: string]: Function
  }
  // map of request IDs to requests in flight
  requests: {
    [requestId: string]: BackendRequest
  }
  routes: BackendRoute[]
  reset: () => void
}
