import type {
  CypressIncomingRequest,
  BrowserPreRequest,
} from '@packages/proxy'
import Debug from 'debug'

const debug = Debug('cypress:proxy:http:util:prerequests')
const debugVerbose = Debug('cypress-verbose:proxy:http:util:prerequests')

const metrics: any = {
  browserPreRequestsReceived: 0,
  proxyRequestsReceived: 0,
  immediatelyMatchedRequests: 0,
  unmatchedRequests: 0,
  unmatchedPreRequests: 0,
}

process.once('exit', () => {
  debug('metrics: %o', metrics)
})

export type GetPreRequestCb = (browserPreRequest?: BrowserPreRequest) => void

type PendingRequest = {
  ctxDebug
  callback: GetPreRequestCb
  timeout: NodeJS.Timeout
}

type PendingPreRequest = {
  browserPreRequest: BrowserPreRequest
  timestamp: number
}

/**
 * Data structure that organizes items with duplicated keys into stacks.
 */
class StackMap<T> {
  private stacks: Record<string, Array<T>> = {}
  push (stackKey: string, value: T) {
    if (!this.stacks[stackKey]) this.stacks[stackKey] = []

    this.stacks[stackKey].push(value)
  }
  pop (stackKey: string): T | undefined {
    const stack = this.stacks[stackKey]

    if (!stack) return

    const item = stack.pop()

    if (stack.length === 0) delete this.stacks[stackKey]

    return item
  }
  removeMatching (filterFn: (value: T) => boolean) {
    Object.entries(this.stacks).forEach(([stackKey, stack]) => {
      this.stacks[stackKey] = stack.filter(filterFn)
      if (this.stacks[stackKey].length === 0) delete this.stacks[stackKey]
    })
  }
  removeExact (stackKey: string, value: T) {
    const i = this.stacks[stackKey].findIndex((v) => v === value)

    this.stacks[stackKey].splice(i, 1)
    if (this.stacks[stackKey].length === 0) delete this.stacks[stackKey]
  }
  get length () {
    return Object.values(this.stacks).reduce((prev, cur) => prev + cur.length, 0)
  }
}

// This class' purpose is to match up incoming "requests" (requests from the browser received by the http proxy)
// with "pre-requests" (events received by our browser extension indicating that the browser is about to make a request).
// Because these come from different sources, they can be out of sync, arriving in either order.

// Basically, when requests come in, we want to provide additional data read from the pre-request. but if no pre-request
// ever comes in, we don't want to block proxied requests indefinitely.
export class PreRequests {
  requestTimeout: number
  sweepInterval: number
  pendingPreRequests = new StackMap<PendingPreRequest>()
  pendingRequests = new StackMap<PendingRequest>()
  sweepIntervalTimer: NodeJS.Timeout

  constructor (
    requestTimeout = 500,
    // 10 seconds
    sweepInterval = 1000 * 10,
  ) {
    // If a request comes in and we don't have a matching pre-request after this timeout,
    // we invoke the request callback to tell the server to proceed (we don't want to block
    // user requests indefinitely).
    this.requestTimeout = requestTimeout
    this.sweepInterval = sweepInterval

    // Discarding prerequests on the other hand is not urgent, so we do it on a regular interval
    // rather than with a separate timer for each one.
    // 2 times the requestTimeout is arbitrary, chosen to give plenty of time and
    // make sure we don't discard any pre-requests prematurely but that we don't leak memory over time
    // if a large number of pre-requests don't match up
    // fixes: https://github.com/cypress-io/cypress/issues/17853
    this.sweepIntervalTimer = setInterval(() => {
      const now = Date.now()

      this.pendingPreRequests.removeMatching(({ timestamp, browserPreRequest }) => {
        if (timestamp + this.sweepInterval < now) {
          debugVerbose('timed out unmatched pre-request: %o', browserPreRequest)
          metrics.unmatchedPreRequests++

          return false
        }

        return true
      })
    }, this.sweepInterval)
  }

  addPending (browserPreRequest: BrowserPreRequest) {
    metrics.browserPreRequestsReceived++
    const key = `${browserPreRequest.method}-${browserPreRequest.url}`
    const pendingRequest = this.pendingRequests.pop(key)

    if (pendingRequest) {
      debugVerbose('Incoming pre-request %s matches pending request. %o', key, browserPreRequest)
      clearTimeout(pendingRequest.timeout)
      pendingRequest.callback(browserPreRequest)

      return
    }

    debugVerbose('Caching pre-request %s to be matched later. %o', key, browserPreRequest)
    this.pendingPreRequests.push(key, {
      browserPreRequest,
      timestamp: Date.now(),
    })
  }

  get (req: CypressIncomingRequest, ctxDebug, callback: GetPreRequestCb) {
    metrics.proxyRequestsReceived++
    const key = `${req.method}-${req.proxiedUrl}`
    const pendingPreRequest = this.pendingPreRequests.pop(key)

    if (pendingPreRequest) {
      metrics.immediatelyMatchedRequests++
      ctxDebug('Incoming request %s matches known pre-request: %o', key, pendingPreRequest)
      callback(pendingPreRequest.browserPreRequest)

      return
    }

    const pendingRequest: PendingRequest = {
      ctxDebug,
      callback,
      timeout: setTimeout(() => {
        ctxDebug('Never received pre-request for request %s after waiting %sms. Continuing without one.', key, this.requestTimeout)
        metrics.unmatchedRequests++
        this.pendingRequests.removeExact(key, pendingRequest)
        callback()
      }, this.requestTimeout),
    }

    this.pendingRequests.push(key, pendingRequest)
  }
}
