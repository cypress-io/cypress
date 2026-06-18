import type { ForStubbing } from '@packages/network-interception'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    routes: [],
    pendingEventHandlers: {},
    reset () {
      this.pendingEventHandlers = {}
      this.routes = []
    },
  }
}

export function resetStubbingState (stubbing: ForStubbing): void {
  (stubbing as NetStubbingState).reset()
}
