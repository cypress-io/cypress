import type { BackendRoute } from '@packages/network-interception'

export type { BackendRoute, GetFixtureFn } from '@packages/network-interception'

export { ResourceType } from '../types'

export interface NetStubbingState {
  pendingEventHandlers: {
    [eventId: string]: (opts: { changedData: any, stopPropagation: boolean }) => void
  }
  routes: BackendRoute[]
  reset: () => void
}
