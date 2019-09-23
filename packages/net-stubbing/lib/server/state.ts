import { NetStubbingState } from './types'

export function State () : NetStubbingState {
  return {
    requests: {},
    routes: [],
    reset () {
      this.requests = {}
      this.routes = []
    },
  }
}
