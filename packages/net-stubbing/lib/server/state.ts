import { NetStubbingState } from './types'

export function state () : NetStubbingState {
  return {
    requests: {},
    routes: [],
    reset () {
      this.requests = {}
      this.routes = []
    },
  }
}
