import { Http } from './http'

export class NetworkProxy {
  http: Http

  constructor (opts: {
    config: any
    getRemoteState: () => any
    middleware?: any
  }) {
    this.http = new Http(opts)
  }

  handleHttpRequest (req, res) {
    this.http.handle(req, res)
  }

  getHttpBuffer (urlStr) {
    return this.http.getBuffer(urlStr)
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset () {
    this.http.reset()
  }
}
