import _ from 'lodash'
import Debug from 'debug'
import type net from 'net'
import type { Request } from 'express'
import type { RemoteStates } from '@packages/network-tools'

const debug = Debug('cypress:server:util:socket_allowed')

/**
 * Utility to validate incoming, local socket connections against a list of
 * expected client TCP ports.
 */
export class SocketAllowed {
  allowedLocalPorts: number[] = []

  constructor (private remoteStates: RemoteStates, private getServerPort: () => number | undefined) {}

  /**
   * Add a socket to the allowed list.
   */
  add = (socket: net.Socket) => {
    const { localPort } = socket

    debug('allowing socket %o', { localPort })
    this.allowedLocalPorts.push(localPort as number)

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
    const remotePortInAllowList = this.allowedLocalPorts.includes(remotePort!)

    // When testing cypress in cypress, we pass along the x-cypress-forwarded-from-cypress header to signify this is a safe request
    const trustedSourceUsingCypressInCypress = !!process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && !!req.headers['x-cypress-forwarded-from-cypress']
    const isAllowed = (remotePortInAllowList || trustedSourceUsingCypressInCypress) && ['127.0.0.1', '::1'].includes(remoteAddress!)

    debug('is incoming request allowed? %o', { isAllowed, reqUrl: req.url, remotePort, remoteAddress })

    return isAllowed
  }

  /**
   * The port allow-list is populated by proxy CONNECT tracking, which never
   * happens with the MITM proxy disabled — a loopback remoteAddress is the
   * only available gate for direct websocket upgrades there.
   */
  isRequestFromLocalhost (req: Request) {
    const { remoteAddress } = req.socket
    const isAllowed = ['127.0.0.1', '::1'].includes(remoteAddress!)

    debug('is incoming request from localhost? %o', { isAllowed, reqUrl: req.url, remoteAddress })

    return isAllowed
  }

  /**
   * Is this origin the primary remote state's origin or the server's own origin?
   */
  isTrustedOrigin = (origin: string) => {
    if (!/^https?:\/\//.test(origin)) {
      return false
    }

    const serverPort = this.getServerPort()
    let isTrusted = serverPort !== undefined && origin === `http://localhost:${serverPort}`

    try {
      isTrusted ||= this.remoteStates.hasPrimary() && this.remoteStates.isPrimarySuperDomainOrigin(origin)
    } catch (err) {
      debug('could not compare origin to the primary remote state %o', { origin, err })
    }

    debug('is origin trusted? %o', { origin, isTrusted })

    return isTrusted
  }
}
