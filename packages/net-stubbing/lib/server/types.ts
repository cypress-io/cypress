import type {
  RouteMatcherOptions,
  BackendStaticResponse,
} from '../types'
import type {
  InterceptedRequest,
} from './intercepted-request'

export { ResourceType } from '../types'

export type GetFixtureFn = (path: string, opts?: { encoding?: string | null }) => Promise<any>

export interface BackendRoute {
  routeMatcher: RouteMatcherOptions
  id: string
  hasInterceptor: boolean
  staticResponse?: BackendStaticResponse
  getFixture: GetFixtureFn
  matches: number
  disabled?: boolean
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
