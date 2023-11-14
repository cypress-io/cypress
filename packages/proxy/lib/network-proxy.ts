import { telemetry } from '@packages/telemetry'
import { Http, ServerCtx } from './http'
import type { BrowserPreRequest } from './types'

export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
  }

  addPendingBrowserPreRequest (preRequest: BrowserPreRequest) {
    this.http.addPendingBrowserPreRequest(preRequest)
  }

  removePendingBrowserPreRequest (requestId: string) {
    this.http.removePendingBrowserPreRequest(requestId)
  }

  addPendingUrlWithoutPreRequest (url: string) {
    this.http.addPendingUrlWithoutPreRequest(url)
  }

  handleHttpRequest (req, res) {
    const span = telemetry.startSpan({
      name: 'network:proxy:handleHttpRequest',
      opts: {
        attributes: {
          'network:proxy:url': req.proxiedUrl,
          'network:proxy:contentType': req.get('content-type'),
        },
      },
      isVerbose: true,
    })

    this.http.handleHttpRequest(req, res, span).finally(() => {
      span?.end()
    })
  }

  handleSourceMapRequest (req, res) {
    this.http.handleSourceMapRequest(req, res)
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset () {
    this.http.reset()
  }

  setProtocolManager (protocolManager) {
    this.http.setProtocolManager(protocolManager)
  }

  setPreRequestTimeout (timeout) {
    this.http.setPreRequestTimeout(timeout)
  }
}
