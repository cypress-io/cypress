import type {
  CypressIncomingRequest,
  BrowserPreRequest,
  BrowserPreRequestWithTimings,
} from '../../types'
import type { ProtocolManagerShape } from '@packages/types'
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

export type CorrelationInformation = {
  browserPreRequest?: BrowserPreRequestWithTimings
  noPreRequestExpected?: boolean
}

export type GetPreRequestCb = (correlationInformation: CorrelationInformation) => void

export type PendingRequest = {
  key: string
  ctxDebug
  callback?: GetPreRequestCb
  timeout: NodeJS.Timeout
  timedOut?: boolean
  proxyRequestReceivedTimestamp: number
}

type PendingPreRequest = {
  browserPreRequest: BrowserPreRequest
  cdpRequestWillBeSentTimestamp: number
  cdpRequestWillBeSentReceivedTimestamp: number
}

type PendingUrlWithoutPreRequest = {
  timestamp: number
}

/**
 * Data structure that organizes items with duplicated keys into queues.
 */
class QueueMap<T> {
  private queues: Record<string, Array<T>> = {}
  push (queueKey: string, value: T) {
    if (!this.queues[queueKey]) this.queues[queueKey] = []

    this.queues[queueKey].push(value)
  }
  shift (queueKey: string): T | undefined {
    const queue = this.queues[queueKey]

    if (!queue) return

    const item = queue.shift()

    if (queue.length === 0) delete this.queues[queueKey]

    return item
  }
  removeMatching (filterFn: (value: T) => boolean) {
    Object.entries(this.queues).forEach(([queueKey, queue]) => {
      this.queues[queueKey] = queue.filter(filterFn)
      if (this.queues[queueKey].length === 0) delete this.queues[queueKey]
    })
  }
  removeExact (queueKey: string, value: T) {
    const i = this.queues[queueKey]?.findIndex((v) => v === value)

    if (i > -1) {
      this.queues[queueKey].splice(i, 1)
      if (this.queues[queueKey].length === 0) delete this.queues[queueKey]
    }
  }

  forEach (fn: (value: T) => void) {
    Object.values(this.queues).forEach((queue) => {
      queue.forEach(fn)
    })
  }

  get length () {
    return Object.values(this.queues).reduce((prev, cur) => prev + cur.length, 0)
  }
}

const tryDecodeURI = (url: string) => {
  // decodeURI can throw if the url is malformed
  // in this case, we just return the original url
  try {
    return decodeURI(url)
  } catch (e) {
    return url
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
  pendingPreRequests = new QueueMap<PendingPreRequest>()
  pendingRequests = new QueueMap<PendingRequest>()
  pendingUrlsWithoutPreRequests = new QueueMap<PendingUrlWithoutPreRequest>()
  pendingPreRequestsToRemove: Map<string, number> = new Map()
  sweepIntervalTimer: NodeJS.Timeout
  protocolManager?: ProtocolManagerShape

  constructor (
    requestTimeout = 2000,
    // 10 seconds
    sweepInterval = 10000,
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

      this.pendingPreRequests.removeMatching(({ cdpRequestWillBeSentReceivedTimestamp, browserPreRequest }) => {
        if (cdpRequestWillBeSentReceivedTimestamp + this.sweepInterval < now) {
          debugVerbose('timed out unmatched pre-request: %o', browserPreRequest)
          metrics.unmatchedPreRequests++

          this.pendingPreRequestsToRemove.delete(browserPreRequest.requestId)

          return false
        }

        return true
      })

      this.pendingPreRequestsToRemove.forEach((timestamp, requestId) => {
        if (timestamp + this.sweepInterval < now) {
          this.pendingPreRequestsToRemove.delete(requestId)
        }
      })

      this.pendingUrlsWithoutPreRequests.removeMatching(({ timestamp }) => {
        return timestamp + this.sweepInterval >= now
      })
    }, this.sweepInterval)
  }

  checkAndRemovePendingPreRequest (requestId: string) {
    return this.pendingPreRequestsToRemove.delete(requestId)
  }

  addPending (browserPreRequest: BrowserPreRequest) {
    const key = `${browserPreRequest.method}-${tryDecodeURI(browserPreRequest.url)}`

    // if we have a pending request to remove, we should remove it now and return
    // since we don't want to proceed with this pre-request anymore. In practice,
    // this typically happens when we receive a cached response while executing
    // the async function to add the pre-request
    if (this.checkAndRemovePendingPreRequest(browserPreRequest.requestId)) {
      debugVerbose('Received previous request to remove pre-request %s, skipping adding', browserPreRequest.requestId)

      return
    }

    metrics.browserPreRequestsReceived++
    const pendingRequest = this.pendingRequests.shift(key)

    if (pendingRequest) {
      let cdpLagDuration; let proxyRequestCorrelationDuration = 0

      if (browserPreRequest.cdpRequestWillBeSentReceivedTimestamp) {
        if (browserPreRequest.cdpRequestWillBeSentTimestamp) {
          cdpLagDuration = browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - browserPreRequest.cdpRequestWillBeSentTimestamp
        }

        if (pendingRequest.proxyRequestReceivedTimestamp) {
          proxyRequestCorrelationDuration = Math.max(browserPreRequest.cdpRequestWillBeSentReceivedTimestamp - pendingRequest.proxyRequestReceivedTimestamp, 0)
        }
      }

      const timings = {
        cdpRequestWillBeSentTimestamp: browserPreRequest.cdpRequestWillBeSentTimestamp ?? 0,
        cdpRequestWillBeSentReceivedTimestamp: browserPreRequest.cdpRequestWillBeSentReceivedTimestamp ?? 0,
        proxyRequestReceivedTimestamp: pendingRequest.proxyRequestReceivedTimestamp,
        cdpLagDuration,
        proxyRequestCorrelationDuration,
      }

      debugVerbose('Incoming pre-request %s matches pending request. %o', key, browserPreRequest)
      if (!pendingRequest.timedOut) {
        clearTimeout(pendingRequest.timeout)
        pendingRequest.callback?.({
          browserPreRequest: {
            ...browserPreRequest,
            ...timings,
          },
          noPreRequestExpected: false,
        })

        delete pendingRequest.callback

        return
      }

      this.protocolManager?.responseStreamTimedOut({
        requestId: browserPreRequest.requestId,
        timings,
      })

      return
    }

    debugVerbose('Caching pre-request %s to be matched later. %o', key, browserPreRequest)
    this.pendingPreRequests.push(key, {
      browserPreRequest,
      cdpRequestWillBeSentTimestamp: browserPreRequest.cdpRequestWillBeSentTimestamp ?? 0,
      cdpRequestWillBeSentReceivedTimestamp: browserPreRequest.cdpRequestWillBeSentReceivedTimestamp ?? 0,
    })
  }

  addPendingUrlWithoutPreRequest (url: string) {
    const key = `GET-${tryDecodeURI(url)}`
    const pendingRequest = this.pendingRequests.shift(key)

    if (pendingRequest) {
      debugVerbose('Handling %s without a CDP prerequest', key)
      clearTimeout(pendingRequest.timeout)
      pendingRequest.callback?.({
        noPreRequestExpected: true,
      })

      delete pendingRequest.callback

      return
    }

    this.pendingUrlsWithoutPreRequests.push(key, {
      timestamp: Date.now(),
    })
  }

  removePendingPreRequest (requestId: string) {
    let removed = false

    this.pendingPreRequests.removeMatching(({ browserPreRequest }) => {
      const matches = (browserPreRequest.requestId.includes('-retry-') && browserPreRequest.requestId.startsWith(`${requestId}-`)) ||
        (!browserPreRequest.requestId.includes('-retry-') && browserPreRequest.requestId === requestId)

      if (matches && !removed) {
        removed = true
      }

      return !matches
    })

    // if we didn't find a pre-request to remove, add it to the pending list so we can remove it later,
    // this typically happens when we receive a cached response while executing
    // the async function to add the pre-request
    if (!removed) {
      debugVerbose('No pre-request found to remove, adding to pending list: %s', requestId)
      this.pendingPreRequestsToRemove.set(requestId, Date.now())
    } else {
      debugVerbose('Removed pre-request %s', requestId)
    }

    return removed
  }

  get (req: CypressIncomingRequest, ctxDebug, callback: GetPreRequestCb) {
    const proxyRequestReceivedTimestamp = performance.now() + performance.timeOrigin

    metrics.proxyRequestsReceived++
    const key = `${req.method}-${tryDecodeURI(req.proxiedUrl)}`
    const pendingPreRequest = this.pendingPreRequests.shift(key)

    if (pendingPreRequest) {
      metrics.immediatelyMatchedRequests++
      ctxDebug('Incoming request %s matches known pre-request: %o', key, pendingPreRequest)

      callback({
        browserPreRequest: {
          ...pendingPreRequest.browserPreRequest,
          cdpRequestWillBeSentTimestamp: pendingPreRequest.cdpRequestWillBeSentTimestamp,
          cdpRequestWillBeSentReceivedTimestamp: pendingPreRequest.cdpRequestWillBeSentReceivedTimestamp,
          proxyRequestReceivedTimestamp,
          cdpLagDuration: pendingPreRequest.cdpRequestWillBeSentReceivedTimestamp - pendingPreRequest.cdpRequestWillBeSentTimestamp,
          proxyRequestCorrelationDuration: Math.max(pendingPreRequest.cdpRequestWillBeSentReceivedTimestamp - proxyRequestReceivedTimestamp, 0),
        },
        noPreRequestExpected: false,
      })

      return
    }

    const pendingUrlWithoutPreRequests = this.pendingUrlsWithoutPreRequests.shift(key)

    if (pendingUrlWithoutPreRequests) {
      metrics.immediatelyMatchedRequests++
      ctxDebug('Incoming request %s matches known pending url without pre request', key)
      callback({
        noPreRequestExpected: true,
      })

      return
    }

    const pendingRequest: PendingRequest = {
      key,
      ctxDebug,
      callback,
      proxyRequestReceivedTimestamp: performance.now() + performance.timeOrigin,
      timeout: setTimeout(() => {
        ctxDebug('Never received pre-request or url without pre-request for request %s after waiting %sms. Continuing without one.', key, this.requestTimeout)
        debug('Never received pre-request or url without pre-request for request %s after waiting %sms. Continuing without one.', key, this.requestTimeout)
        metrics.unmatchedRequests++
        pendingRequest.timedOut = true
        callback({
          noPreRequestExpected: false,
        })

        delete pendingRequest.callback
      }, this.requestTimeout),
    }

    this.pendingRequests.push(key, pendingRequest)

    return pendingRequest
  }

  setProtocolManager (protocolManager: ProtocolManagerShape) {
    this.protocolManager = protocolManager
  }

  setPreRequestTimeout (requestTimeout: number) {
    this.requestTimeout = requestTimeout
  }

  removePendingRequest (pendingRequest: PendingRequest) {
    this.pendingRequests.removeExact(pendingRequest.key, pendingRequest)
    clearTimeout(pendingRequest.timeout)
    delete pendingRequest.callback
  }

  reset () {
    this.pendingPreRequests = new QueueMap<PendingPreRequest>()

    // Clear out the pending requests timeout callbacks first then clear the queue
    this.pendingRequests.forEach(({ callback, timeout, timedOut }) => {
      // If the request has already timed out, just return
      if (timedOut) return

      clearTimeout(timeout)
      metrics.unmatchedRequests++
      callback?.({
        noPreRequestExpected: false,
      })
    })

    this.pendingRequests = new QueueMap<PendingRequest>()
    this.pendingUrlsWithoutPreRequests = new QueueMap<PendingUrlWithoutPreRequest>()
    this.pendingPreRequestsToRemove = new Map()
  }
}
