import { noop } from 'lodash'
import { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    reset () {
      // clean up requests that are still pending
      for (const requestId in this.requests) {
        const request = this.requests[requestId]

        request.res.removeAllListeners('finish')
        request.res.removeAllListeners('error')
        request.res.on('error', noop)
        request.res.destroy()
      }

      this.requests = {}
      this.routes = []
    },
  }
}
