import { Http, HttpMiddlewareStacks } from './http'
import CyServer from '@packages/server'
import { NetStubbingState } from '@packages/net-stubbing/server'

export class NetworkProxy {
  http: Http

  constructor (opts: {
    config: CyServer.Config
    getRemoteState: CyServer.getRemoteState
    middleware?: HttpMiddlewareStacks
    netStubbingState: NetStubbingState
    request: any
    socket: CyServer.Socket
  }) {
    this.http = new Http(opts)
  }

  handleHttpRequest (req, res) {
    this.http.handle(req, res)
  }

  setHttpBuffer (buffer) {
    this.http.setBuffer(buffer)
  }

  reset () {
    this.http.reset()
  }
}
