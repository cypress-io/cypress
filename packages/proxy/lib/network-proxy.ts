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

  handleHttpRequest (req, res) {
    const span = telemetry.startSpan({
      name: 'network:proxy:handleHttpRequest',
      opts: {
        attributes: {
          url: req.proxiedUrl,
        },
      },
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
}
