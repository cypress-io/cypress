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
  timeout: ReturnType<typeof setTimeout>
}

// This class' purpose is to match up incoming "requests" (requests from the browser received by the http proxy)
// with "pre-requests" (events received by our browser extension indicating that the browser is about to make a request).
// Because these come from different sources, they can be out of sync, arriving in either order.

// Basically, when requests come in, we want to provide additional data read from the pre-request. but if no pre-request
// ever comes in, we don't want to block proxied requests indefinitely.
export class PreRequests {
  requestTimeout: number
  pendingPreRequests: Record<string, BrowserPreRequest> = {}
  pendingRequests: Record<string, PendingRequest> = {}
  prerequestTimestamps: Record<string, number> = {}
  sweepInterval: ReturnType<typeof setInterval>

  constructor (requestTimeout = 500) {
    // If a request comes in and we don't have a matching pre-request after this timeout,
    // we invoke the request callback to tell the server to proceed (we don't want to block
    // user requests indefinitely).
    this.requestTimeout = requestTimeout

    // Discarding prerequests on the other hand is not urgent, so we do it on a regular interval
    // rather than with a separate timer for each one.
    // 2 times the requestTimeout is arbitrary, chosen to give plenty of time and
    // make sure we don't discard any pre-requests prematurely but that we don't leak memory over time
    // if a large number of pre-requests don't match up
    // fixes: https://github.com/cypress-io/cypress/issues/17853
    this.sweepInterval = setInterval(() => {
      const now = Date.now()

      Object.entries(this.prerequestTimestamps).forEach(([key, timestamp]) => {
        if (timestamp + this.requestTimeout * 2 < now) {
          debugVerbose('timed out unmatched pre-request %s: %o', key, this.pendingPreRequests[key])
          metrics.unmatchedPreRequests++
          delete this.pendingPreRequests[key]
          delete this.prerequestTimestamps[key]
        }
      })
    }, this.requestTimeout * 2)
  }

  addPending (browserPreRequest: BrowserPreRequest) {
    metrics.browserPreRequestsReceived++
    const key = `${browserPreRequest.method}-${browserPreRequest.url}`

    if (this.pendingRequests[key]) {
      debugVerbose('Incoming pre-request %s matches pending request. %o', key, browserPreRequest)
      clearTimeout(this.pendingRequests[key].timeout)
      this.pendingRequests[key].callback(browserPreRequest)
      delete this.pendingRequests[key]
    }

    debugVerbose('Caching pre-request %s to be matched later. %o', key, browserPreRequest)
    this.pendingPreRequests[key] = browserPreRequest
    this.prerequestTimestamps[key] = Date.now()
  }

  get (req: CypressIncomingRequest, ctxDebug, callback: GetPreRequestCb) {
    metrics.proxyRequestsReceived++
    const key = `${req.method}-${req.proxiedUrl}`

    if (this.pendingPreRequests[key]) {
      metrics.immediatelyMatchedRequests++
      ctxDebug('Incoming request %s matches known pre-request: %o', key, this.pendingPreRequests[key])
      callback(this.pendingPreRequests[key])

      delete this.pendingPreRequests[key]
      delete this.prerequestTimestamps[key]

      return
    }

    const timeout = setTimeout(() => {
      callback()
      ctxDebug('Never received pre-request for request %s after waiting %sms. Continuing without one.', key, this.requestTimeout)
      metrics.unmatchedRequests++
      delete this.pendingRequests[key]
    }, this.requestTimeout)

    this.pendingRequests[key] = {
      ctxDebug,
      callback,
      timeout,
    }
  }
}
