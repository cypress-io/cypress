import {
  RouteMatcherOptions,
  BackendStaticResponse,
} from '../types'
import {
  InterceptedRequest,
} from './intercepted-request'

export type GetFixtureFn = (path: string, opts?: { encoding?: string | null }) => Promise<any>

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  handlerId: string
  hasInterceptor: boolean
  staticResponse?: BackendStaticResponse
  getFixture: GetFixtureFn
}

export interface NetStubbingState {
  pendingEventHandlers: {
    [eventId: string]: Function
  }
  requests: {
    [requestId: string]: InterceptedRequest
  }
  routes: BackendRoute[]
  reset: () => void
}
