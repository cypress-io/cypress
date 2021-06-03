import {
  CypressIncomingRequest,
  BrowserPreRequest,
} from '@packages/proxy'
import Debug from 'debug'
const debug = Debug('cypress:proxy:http:util:prerequests')

export type GetPreRequestCb = (browserPreRequest?: BrowserPreRequest) => void

export class PreRequests {
  pendingBrowserPreRequests: Array<BrowserPreRequest> = []
  requestsPendingPreRequestCbs: Array<{
    cb: (browserPreRequest: BrowserPreRequest) => void
    method: string
    proxiedUrl: string
  }> = []

  get (req: CypressIncomingRequest, ctxDebug, cb: GetPreRequestCb) {
    const i = this.pendingBrowserPreRequests.findIndex((v: BrowserPreRequest) => {
      return v.method === req.method && v.url === req.proxiedUrl
    })

    if (i !== -1) {
      const [preRequest] = this.pendingBrowserPreRequests.splice(i, 1)

      ctxDebug('matches pending pre-request %o', preRequest)

      return cb(preRequest)
    }

    let timeout = setTimeout(() => {
      ctxDebug('500ms passed without a pre-request, continuing to wait')

      timeout = setTimeout(() => {
        ctxDebug('10000ms more passed without a pre-request, continuing request with an empty pre-request field!')

        remove()
        cb()
      }, 10000)
    }, 500)

    const startedMs = Date.now()
    const remove = () => this.requestsPendingPreRequestCbs.splice(this.requestsPendingPreRequestCbs.indexOf(requestPendingPreRequestCb))

    const requestPendingPreRequestCb = {
      cb: (browserPreRequest) => {
        ctxDebug('received pre-request after %dms %o', Date.now() - startedMs, browserPreRequest)
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
    debug('received browser pre-request: %o', browserPreRequest)

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
