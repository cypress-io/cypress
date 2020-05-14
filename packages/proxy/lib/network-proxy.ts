import { Http, ServerCtx } from './http'

export class NetworkProxy {
  http: Http

  constructor (opts: ServerCtx) {
    this.http = new Http(opts)
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
