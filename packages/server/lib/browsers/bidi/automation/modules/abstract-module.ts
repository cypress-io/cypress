import { BidiSocket } from '../../sockets/bidi-socket'

export abstract class AbstractModule {
  protected _bidiSocket: BidiSocket
  constructor (bidiSocket: BidiSocket) {
    this._bidiSocket = bidiSocket
  }
}
