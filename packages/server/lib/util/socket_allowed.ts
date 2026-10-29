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
   * A browser stamps WebSocket handshakes with the opening document's Origin,
   * and only Cypress serves the runner document at a trusted origin. The Firefox
   * extension's background page connects from its own moz-extension:// origin,
   * which no web page can claim.
   */
  isRequestFromTrustedOrigin (req: Pick<Request, 'headers'>, { allowExtension = false } = {}): boolean {
    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && req.headers['x-cypress-forwarded-from-cypress']) {
      return true
    }

    const { origin } = req.headers
    const isAllowed = typeof origin === 'string' && ((allowExtension && origin.startsWith('moz-extension://')) || this.isTrustedOrigin(origin))

    debug('is incoming request from a trusted origin? %o', { isAllowed, origin })

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
    // URL drops a default port, as browsers do when reporting an origin
    let isTrusted = serverPort !== undefined && origin === new URL(`http://localhost:${serverPort}`).origin

    try {
      isTrusted ||= this.remoteStates.hasPrimary() && this.remoteStates.isPrimarySuperDomainOrigin(origin)
    } catch (err) {
      debug('could not compare origin to the primary remote state %o', { origin, err })
    }

    debug('is origin trusted? %o', { origin, isTrusted })

    return isTrusted
  }
}
