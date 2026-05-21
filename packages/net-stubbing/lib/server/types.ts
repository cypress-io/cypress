import type { BackendRoute } from '@packages/network-policy'
import type {
  InterceptedRequest,
} from './intercepted-request'

export type { BackendRoute, GetFixtureFn } from '@packages/network-policy'

export { ResourceType } from '../types'

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
