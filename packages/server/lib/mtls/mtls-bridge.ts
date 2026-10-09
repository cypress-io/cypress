import net from 'net'
import tls from 'tls'
import Debug from 'debug'
import type { Duplex } from 'stream'
import type { SecureContext } from 'tls'
import { allowDestroy } from '@packages/network'
import { scanClientHello } from './client-hello'
import type { BoundBridgeListener, BridgeListener, ClientCertificateMaterial } from './bridge-plan'

const debug = Debug('cypress:server:mtls')

export interface UpstreamConnectOptions {
  /** Hostname to dial and to send as SNI. Taken from the browser's own SNI. */
  hostname: string
  port: number
  /** Protocols the browser offered; empty means offer no ALPN at all. */
  alpnProtocols: string[]
  material: ClientCertificateMaterial
}

export interface UpstreamConnection {
  socket: Duplex
  /** What the origin selected, or `false` when ALPN was not negotiated. */
  alpnProtocol: string | false | null
}

export interface MtlsBridgeOptions {
  listeners: BridgeListener[]
  /**
   * Opens the real mTLS connection to the origin. Injected because the dial owns an upstream
   * proxy, which the bridge must not assume away.
   */
  connectUpstream (options: UpstreamConnectOptions): Promise<UpstreamConnection>
  /** Supplies a server certificate impersonating an origin. */
  secureContextFor (servername: string): Promise<SecureContext>
}

// Only letters, digits, `-` and `_` in dot-separated labels. A wildcard pattern's `*` matches
// any character but `/`, so without this a name carrying CR/LF or NUL would reach the
// upstream proxy's CONNECT line and the resolver intact.
const DNS_NAME = /^[a-z0-9_-]+(\.[a-z0-9_-]+)*$/

/**
 * The host to dial for a connection to this listener, or null when there is none it may
 * truthfully stand for.
 *
 * The listener is reachable by any local process and by any page in the browser, and the
 * origin is dialed with this listener's key, so a name it was not configured for must never
 * get that far.
 */
function originFor (listener: BridgeListener, servername: string | null): string | null {
  const wildcard = listener.hostname.includes('*')

  // A browser sends no SNI for an IP literal, so an exact listener stands for its own host.
  // A wildcard one only knows its origin from SNI.
  if (servername === null) {
    return wildcard ? null : listener.hostname
  }

  const name = servername.toLowerCase()

  if (name.length > 253 || !DNS_NAME.test(name)) {
    return null
  }

  // An exact host is compared exactly: as a glob, an IPv6 literal like `[::1]` would be a
  // character class
  return (wildcard ? listener.hostMatcher.match(name) : name === listener.hostname) ? name : null
}

/** What `allowDestroy` adds to a `net.Server`: close, and take live connections with it. */
type DestroyableServer = net.Server & { destroy (cb: () => void): void }

/**
 * Terminates the browser's TLS connection and re-originates it from Node, which is the only
 * process holding the configured private key.
 *
 * Nothing above TLS is parsed. The bridge negotiates upstream first, offers the browser the
 * single protocol the origin chose, and then pipes the two sessions together, so HTTP/2
 * frames pass through opaquely and CDP-level interception is untouched.
 */
export class MtlsBridge {
  private servers: DestroyableServer[] = []

  constructor (private options: MtlsBridgeOptions) {}

  listen (): Promise<BoundBridgeListener[]> {
    return Promise.all(this.options.listeners.map((listener) => this.listenOne(listener)))
  }

  /**
   * `close` alone would only stop the server accepting and then wait out every live
   * connection, so a browser holding a kept-alive session to a listener would stall
   * shutdown indefinitely. The connections are taken down with it.
   */
  async close (): Promise<void> {
    await Promise.all(this.servers.map((server) => {
      return new Promise<void>((resolve) => server.destroy(() => resolve()))
    }))

    this.servers = []
  }

  private listenOne (listener: BridgeListener): Promise<BoundBridgeListener> {
    const server = allowDestroy(net.createServer((socket) => this.onConnection(socket, listener))) as DestroyableServer

    this.servers.push(server)

    return new Promise((resolve, reject) => {
      // A `net.Server` with no `error` listener throws, so this one outlives the bind it
      // rejects on. Rejecting a settled promise afterwards is a no-op.
      server.on('error', (err) => {
        debug('listener error for %s: %o', listener.hostname, err)
        reject(err)
      })

      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address() as net.AddressInfo

        resolve({ hostname: listener.hostname, port: listener.port, listenPort: port })
      })
    })
  }

  private onConnection (browserSocket: net.Socket, listener: BridgeListener): void {
    // https://github.com/cypress-io/cypress/issues/3192
    browserSocket.setNoDelay(true)
    browserSocket.on('error', (err) => debug('browser socket error %o', { err }))

    let buffered = Buffer.alloc(0)

    const onData = (chunk: Buffer): void => {
      buffered = Buffer.concat([buffered, chunk])

      const scan = scanClientHello(buffered)

      if (scan.kind === 'incomplete') {
        return
      }

      browserSocket.removeListener('data', onData)

      // Pause in the same tick. Removing the last 'data' listener does not leave flowing
      // mode, so anything the browser sends while the origin handshake runs — TLS 1.3 sends
      // a change_cipher_spec straight after the ClientHello — would be read off the socket
      // and dropped on the floor before the replay below.
      browserSocket.pause()

      // A resolver rule captures a whole origin, so a plaintext connection to it arrives
      // here too. There is no certificate to present on one, so fail it rather than
      // quietly proxying it.
      if (scan.kind === 'not-tls') {
        debug('first bytes to %s are not a TLS ClientHello; closing', listener.hostname)
        browserSocket.destroy()

        return
      }

      const hostname = originFor(listener, scan.servername)

      if (!hostname) {
        debug('servername %s is not one listener %s stands for; closing', scan.servername, listener.hostname)
        browserSocket.destroy()

        return
      }

      this.bridge(browserSocket, buffered, listener, hostname, scan.alpnProtocols)
      .catch((err) => {
        debug('failed to bridge %s: %o', hostname, err)
        browserSocket.destroy()
      })
    }

    browserSocket.on('data', onData)
  }

  private async bridge (
    browserSocket: net.Socket,
    clientHello: Buffer,
    listener: BridgeListener,
    servername: string,
    alpnProtocols: string[],
  ): Promise<void> {
    // Recorded before the handshake starts: the browser can go away while it is still in
    // flight, and a listener registered afterwards would never hear the 'close' it already
    // missed, orphaning an established connection to the origin.
    let browserGone = false

    browserSocket.once('close', () => {
      browserGone = true
    })

    const upstream = await this.options.connectUpstream({
      hostname: servername,
      port: listener.port,
      alpnProtocols,
      material: listener.material,
    })

    // Belt and braces: the paths below generally clean up on their own, but none of them is
    // guaranteed to run once the browser has already gone.
    if (browserGone || browserSocket.destroyed) {
      debug('browser left during the %s handshake; dropping the origin connection', servername)
      upstream.socket.destroy()

      return
    }

    // Registered before the next await so an upstream connection is not orphaned when the
    // forged identity fails, and so a browser that simply goes away releases it too.
    browserSocket.on('close', () => upstream.socket.destroy())

    const secureContext = await this.options.secureContextFor(servername)

    // The browser is offered exactly what the origin selected, so a downgrade upstream is
    // reflected rather than hidden. An origin that negotiated no ALPN leaves it unset.
    const browserTls = new tls.TLSSocket(browserSocket, {
      isServer: true,
      secureContext,
      ALPNProtocols: upstream.alpnProtocol ? [upstream.alpnProtocol] : undefined,
    })

    // The ClientHello must be replayed after the TLS socket is constructed and before the
    // underlying socket resumes, or the handshake never starts and reports no error.
    browserSocket.unshift(clientHello)
    browserSocket.resume()

    browserTls.on('error', (err) => {
      debug('browser TLS error for %s: %o', servername, err)
      upstream.socket.destroy()
    })

    upstream.socket.on('error', (err) => {
      debug('upstream error for %s: %o', servername, err)
      browserTls.destroy()
    })

    browserTls.on('secure', () => {
      debug('bridged %s, alpn=%s', servername, browserTls.alpnProtocol)
      browserTls.pipe(upstream.socket).pipe(browserTls)
    })
  }
}
