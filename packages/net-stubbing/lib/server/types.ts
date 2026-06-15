import type { BackendRoute } from '@packages/network-interception'
import type {
  InterceptedRequest,
} from './intercepted-request'

export type { ResourceType } from '@packages/network-interception/lib/types/external-types'

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
