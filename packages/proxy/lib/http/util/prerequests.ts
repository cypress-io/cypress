import type {
  CypressIncomingRequest,
  BrowserPreRequest,
} from '@packages/proxy'
import Debug from 'debug'
import _ from 'lodash'

const debug = Debug('cypress:proxy:http:util:prerequests')
const debugVerbose = Debug('cypress-verbose:proxy:http:util:prerequests')

const metrics: any = {
  browserPreRequestsReceived: 0,
  proxyRequestsReceived: 0,
  immediatelyMatchedRequests: 0,
  eventuallyReceivedPreRequest: [],
  neverReceivedPreRequest: [],
}

process.once('exit', () => {
  debug('metrics: %o', metrics)
})

function removeOne<T> (a: Array<T>, predicate: (v: T) => boolean): T | void {
  for (let i = a.length - 1; i >= 0; i--) {
    const v = a[i]

    if (predicate(v)) {
      a.splice(i, 1)

      return v
    }
  }
}

function matches (preRequest: BrowserPreRequest, req: Pick<CypressIncomingRequest, 'proxiedUrl' | 'method'>) {
  return preRequest.method === req.method && preRequest.url === req.proxiedUrl
}

export type GetPreRequestCb = (browserPreRequest?: BrowserPreRequest) => void

export class PreRequests {
  pendingBrowserPreRequests: Array<BrowserPreRequest> = []
  requestsPendingPreRequestCbs: Array<{
    cb: (browserPreRequest: BrowserPreRequest) => void
    method: string
    proxiedUrl: string
  }> = []

  get (req: CypressIncomingRequest, ctxDebug, cb: GetPreRequestCb) {
    metrics.proxyRequestsReceived++

    const pendingBrowserPreRequest = removeOne(this.pendingBrowserPreRequests, (browserPreRequest) => {
      return matches(browserPreRequest, req)
    })

    if (pendingBrowserPreRequest) {
      metrics.immediatelyMatchedRequests++

      ctxDebug('matches pending pre-request %o', pendingBrowserPreRequest)

      return cb(pendingBrowserPreRequest)
    }

    const timeout = setTimeout(() => {
      metrics.neverReceivedPreRequest.push({ url: req.proxiedUrl })
      ctxDebug('500ms passed without a pre-request, continuing request with an empty pre-request field!')

      remove()
      cb()
    }, 500)

    const startedMs = Date.now()
    const remove = _.once(() => removeOne(this.requestsPendingPreRequestCbs, (v) => v === requestPendingPreRequestCb))

    const requestPendingPreRequestCb = {
      cb: (browserPreRequest) => {
        const afterMs = Date.now() - startedMs

        metrics.eventuallyReceivedPreRequest.push({ url: browserPreRequest.url, afterMs })
        ctxDebug('received pre-request after %dms %o', afterMs, browserPreRequest)
        clearTimeout(timeout)
        remove()
        cb(browserPreRequest)
      },
      proxiedUrl: req.proxiedUrl,
      method: req.method,
    }

    this.requestsPendingPreRequestCbs.push(requestPendingPreRequestCb)
  }

  addPending (browserPreRequest: BrowserPreRequest) {
    if (this.pendingBrowserPreRequests.indexOf(browserPreRequest) !== -1) {
      return
    }

    metrics.browserPreRequestsReceived++

    const requestPendingPreRequestCb = removeOne(this.requestsPendingPreRequestCbs, (req) => {
      return matches(browserPreRequest, req)
    })

    if (requestPendingPreRequestCb) {
      debugVerbose('immediately matched pre-request %o', browserPreRequest)

      return requestPendingPreRequestCb.cb(browserPreRequest)
    }

    debugVerbose('queuing pre-request to be matched later %o %o', browserPreRequest, this.pendingBrowserPreRequests)
    this.pendingBrowserPreRequests.push(browserPreRequest)
  }
}
