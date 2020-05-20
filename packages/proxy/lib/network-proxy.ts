import { Http } from './http'

export class NetworkProxy {
  http: Http

  constructor (opts: {
    config: any
    getRemoteState: () => any
    getFileServerToken: () => string
    middleware?: any
    request: any
  }) {
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
