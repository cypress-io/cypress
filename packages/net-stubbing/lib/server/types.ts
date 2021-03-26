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
  id: string
  hasInterceptor: boolean
  staticResponse?: BackendStaticResponse
  getFixture: GetFixtureFn
}

export interface NetStubbingState {
  pendingEventHandlers: {
    [eventId: string]: (opts: { changedData: any, stopPropagation: boolean }) => void
  }
  requests: {
    [requestId: string]: InterceptedRequest
  }
  routes: BackendRoute[]
  reset: () => void
}
