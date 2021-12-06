import type { DataContext } from '@packages/data-context'
import { Http, ServerCtx } from './http'
import type { BrowserPreRequest } from './types'

export class NetworkProxy {
  http: Http

  constructor (ctx: DataContext, opts: ServerCtx) {
    this.http = new Http(ctx, opts)
  }

  addPendingBrowserPreRequest (preRequest: BrowserPreRequest) {
    this.http.addPendingBrowserPreRequest(preRequest)
  }

  handleHttpRequest (req, res) {
    this.http.handle(req, res)
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
