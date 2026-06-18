import type { BackendRoute, ForStubbing, GetFixtureFn, ResourceType } from '@packages/network-interception'
import type { PendingEventHandler } from '../driver-intercept-bridge'

export type { BackendRoute, GetFixtureFn, ResourceType }

export interface NetStubbingState extends ForStubbing {
  pendingEventHandlers: {
    [eventId: string]: PendingEventHandler
  }
  reset: () => void
}
