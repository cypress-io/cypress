import _ from 'lodash'
import Debug from 'debug'
import net from 'net'
import { Request } from 'express'

const debug = Debug('cypress:server:util:socket_whitelist')

/**
 * Utility to validate incoming, local socket connections against a list of
 * expected client TCP ports.
 */
export class SocketWhitelist {
  whitelistedLocalPorts: number[] = []

  /**
   * Add a socket to the whitelist.
   */
  add = (socket: net.Socket) => {
    const { localPort } = socket

    debug('whitelisting socket %o', { localPort })
    this.whitelistedLocalPorts.push(localPort)

    socket.once('close', () => {
      debug('whitelisted socket closed, removing %o', { localPort })
      this._remove(socket)
    })
  }

  _remove (socket: net.Socket) {
    _.pull(this.whitelistedLocalPorts, socket.localPort)
  }

  /**
   * Is this socket that this request originated from whitelisted?
   */
  isRequestWhitelisted (req: Request) {
    const { remotePort, remoteAddress } = req.socket
    const isWhitelisted = this.whitelistedLocalPorts.includes(remotePort!)
      && ['127.0.0.1', '::1'].includes(remoteAddress!)

    debug('is incoming request whitelisted? %o', { isWhitelisted, reqUrl: req.url, remotePort, remoteAddress })

    return isWhitelisted
  }
}
