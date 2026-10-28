import _ from 'lodash'
import Debug from 'debug'
import type net from 'net'
import type { Request } from 'express'
import { isLocalhost } from '@packages/network-tools'
import type { RemoteStates } from '@packages/network-tools'

const debug = Debug('cypress:server:util:socket_allowed')

function isOwnOrigin (origin: string, serverPort: number): boolean {
  try {
    const url = new URL(origin)

    return url.protocol === 'http:' && isLocalhost(url) && url.port === String(serverPort)
  } catch {
    return false
  }
}

/**
 * Utility to validate incoming, local socket connections against a list of
 * expected client TCP ports.
 */
export class SocketAllowed {
  allowedLocalPorts: number[] = []

  constructor (private _remoteStates?: Pick<RemoteStates, 'hasPrimary' | 'isPrimarySuperDomainOrigin'>) {}

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
   * A browser stamps WebSocket handshakes and POSTs with the opening document's
   * Origin, and the runner document is served either at the primary remote
   * state's origin or at the server's own localhost origin. Component testing
   * always uses the latter, since its primary is the dev server. Any other
   * origin is a different page in some browser. The primary match is exact
   * unless `injectDocumentDomain` is on, where it is by superdomain because top
   * can then sit on a sibling subdomain. The Firefox extension's background page
   * connects from its own moz-extension:// origin, which no web page can claim.
   */
  isTrustedOrigin (origin: string | undefined, { allowExtension = false, serverPort }: { allowExtension?: boolean, serverPort?: number } = {}): boolean {
    if (!origin || origin === 'null') {
      return false
    }

    if (allowExtension && origin.startsWith('moz-extension://')) {
      return true
    }

    if (serverPort && isOwnOrigin(origin, serverPort)) {
      return true
    }

    if (!this._remoteStates?.hasPrimary()) {
      return false
    }

    try {
      return this._remoteStates.isPrimarySuperDomainOrigin(origin)
    } catch {
      return false
    }
  }

  isRequestFromTrustedOrigin (req: Pick<Request, 'headers'> & { socket?: { localPort?: number } }, { allowExtension = false } = {}): boolean {
    if (process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF && req.headers['x-cypress-forwarded-from-cypress']) {
      return true
    }

    const origin = req.headers.origin
    const serverPort = req.socket?.localPort
    const isAllowed = this.isTrustedOrigin(origin, { allowExtension, serverPort })

    debug('is incoming request from a trusted origin? %o', { isAllowed, origin, serverPort })

    return isAllowed
  }
}
