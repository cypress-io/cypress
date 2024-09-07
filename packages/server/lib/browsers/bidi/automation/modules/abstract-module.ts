import { BidiSocket } from '../../sockets/bidi-socket'

export class WebdriverBidiModule {
  protected _bidiSocket: BidiSocket
  constructor (bidiSocket: BidiSocket) {
    this._bidiSocket = bidiSocket
  }
}
