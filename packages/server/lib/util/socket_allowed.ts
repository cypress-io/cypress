import _ from 'lodash'
import Debug from 'debug'
import net from 'net'
import { Request } from 'express'

const debug = Debug('cypress:server:util:socket_allowed')

/**
 * Utility to validate incoming, local socket connections against a list of
 * expected client TCP ports.
 */
export class SocketAllowed {
  allowedLocalPorts: number[] = []

  /**
   * Add a socket to the allowed list.
   */
  add = (socket: net.Socket) => {
    const { localPort } = socket

    debug('allowing socket %o', { localPort })
    this.allowedLocalPorts.push(localPort)

    socket.once('close', () => {
      debug('allowed socket closed, removing %o', { localPort })
      this._remove(socket)
    })
  }

  _remove (socket: net.Socket) {
    _.pull(this.allowedLocalPorts, socket.localPort)
  }

  /**
   * Is this socket that this request originated allowed?
   */
  isRequestAllowed (req: Request) {
    const { remotePort, remoteAddress } = req.socket
    const isAllowed = this.allowedLocalPorts.includes(remotePort!)
      && ['127.0.0.1', '::1'].includes(remoteAddress!)

    debug('is incoming request allowed? %o', { isAllowed, reqUrl: req.url, remotePort, remoteAddress })

    return isAllowed
  }
}
