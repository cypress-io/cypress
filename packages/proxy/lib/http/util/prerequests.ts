import {
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
  eventuallyReceivedPreRequest: [],
  neverReceivedPreRequest: [],
}

process.once('exit', () => {
  debug('metrics: %o', metrics)
})

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

    const i = this.pendingBrowserPreRequests.findIndex((v: BrowserPreRequest) => {
      return v.method === req.method && v.url === req.proxiedUrl
    })

    if (i !== -1) {
      metrics.immediatelyMatchedRequests++
      const [preRequest] = this.pendingBrowserPreRequests.splice(i, 1)

      ctxDebug('matches pending pre-request %o', preRequest)

      return cb(preRequest)
    }

    let timeout = setTimeout(() => {
      metrics.neverReceivedPreRequest.push({ url: req.proxiedUrl })
      ctxDebug('500ms passed without a pre-request, continuing request with an empty pre-request field!')

      remove()
      cb()
    }, 500)

    const startedMs = Date.now()
    const remove = () => this.requestsPendingPreRequestCbs.splice(this.requestsPendingPreRequestCbs.indexOf(requestPendingPreRequestCb))

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
    metrics.browserPreRequestsReceived++

    debugVerbose('received browser pre-request: %o', browserPreRequest)

    const i = this.requestsPendingPreRequestCbs.findIndex((v) => {
      return browserPreRequest.method === v.method && browserPreRequest.url === v.proxiedUrl
    })

    if (i !== -1) {
      const [{ cb }] = this.requestsPendingPreRequestCbs.splice(i, 1)

      return cb(browserPreRequest)
    }

    this.pendingBrowserPreRequests.push(browserPreRequest)
  }
}
