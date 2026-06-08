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
