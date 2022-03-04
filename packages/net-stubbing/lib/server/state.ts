import { noop } from 'lodash'
import type { NetStubbingState } from './types'

export function state (): NetStubbingState {
  return {
    requests: {},
    routes: [],
    pendingEventHandlers: {},
    async reset () {
      // clean up requests that are still pending
      for (const requestId in this.requests) {
        const { res } = this.requests[requestId]

        res.removeAllListeners('finish')
        res.removeAllListeners('error')
        res.on('error', noop)
        await res.end('', () => {
          res.destroy()
        })
      }

      this.pendingEventHandlers = {}
      this.requests = {}
      this.routes = []
    },
  }
}
