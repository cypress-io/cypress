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
  timeout: number
}

export class PreRequests {
  requestTimeout: number
  pendingPreRequests: Record<string, BrowserPreRequest> = {}
  pendingRequests: Record<string, PendingRequest> = {}
  prerequestTimeouts: Record<string, Timeout> = {}

  constructor (requestTimeout = 500) {
    this.requestTimeout = requestTimeout
    setInterval(() => {
      const now = Date.now()

      Object.entries(this.prerequestTimeouts).forEach(([key, timeout]) => {
        if (timeout < now) {
          debugVerbose('timed out unmatched pre-request %o', this.pendingPreRequests[key])
          metrics.unmatchedPreRequests++
          delete this.pendingPreRequests[key]
          delete this.prerequestTimeouts[key]
        }
      })
    }, 2000)
  }

  addPending (browserPreRequest: BrowserPreRequest) {
    metrics.browserPreRequestsReceived++
    const key = `${browserPreRequest.method}-${browserPreRequest.url}`

    if (this.pendingRequests[key]) {
      debugVerbose('immediately matched pre-request %o', browserPreRequest)
      clearTimeout(this.pendingRequests[key].timeout)
      this.pendingRequests[key].callback(browserPreRequest)
      delete this.pendingRequests[key]
    }

    debugVerbose('queuing pre-request to be matched later: %o', browserPreRequest)
    this.pendingPreRequests[key] = browserPreRequest
    this.prerequestTimeouts[key] = Date.now() + 10000
  }

  get (req: CypressIncomingRequest, ctxDebug, callback: GetPreRequestCb) {
    metrics.proxyRequestsReceived++
    const key = `${req.method}-${req.proxiedUrl}`

    if (this.pendingPreRequests[key]) {
      metrics.immediatelyMatchedRequests++
      ctxDebug('matches pending pre-request %o', this.pendingPreRequests[key])
      callback(this.pendingPreRequests[key])

      delete this.pendingPreRequests[key]
      delete this.prerequestTimeouts[key]

      return
    }

    const timeout = setTimeout(() => {
      callback()
      ctxDebug(`Continuing request ${key} without pre-request`)
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
