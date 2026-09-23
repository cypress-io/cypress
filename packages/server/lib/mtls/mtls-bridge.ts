import net from 'net'
import tls from 'tls'
import Debug from 'debug'
import type { Duplex } from 'stream'
import type { SecureContext } from 'tls'
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

/**
 * Terminates the browser's TLS connection and re-originates it from Node, which is the only
 * process holding the configured private key.
 *
 * Nothing above TLS is parsed. The bridge negotiates upstream first, offers the browser the
 * single protocol the origin chose, and then pipes the two sessions together, so HTTP/2
 * frames pass through opaquely and CDP-level interception is untouched.
 */
export class MtlsBridge {
  private servers: net.Server[] = []

  constructor (private options: MtlsBridgeOptions) {}

  listen (): Promise<BoundBridgeListener[]> {
    return Promise.all(this.options.listeners.map((listener) => this.listenOne(listener)))
  }

  async close (): Promise<void> {
    await Promise.all(this.servers.map((server) => {
      return new Promise<void>((resolve) => server.close(() => resolve()))
    }))

    this.servers = []
  }

  private listenOne (listener: BridgeListener): Promise<BoundBridgeListener> {
    const server = net.createServer((socket) => this.onConnection(socket, listener))

    this.servers.push(server)

    return new Promise((resolve, reject) => {
      server.once('error', reject)
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

      // A resolver rule captures a whole origin, so a plaintext connection to it arrives
      // here too. There is no certificate to present on one, so fail it rather than
      // quietly proxying it.
      if (scan.kind === 'not-tls') {
        debug('first bytes to %s are not a TLS ClientHello; closing', listener.hostname)
        browserSocket.destroy()

        return
      }

      // A wildcard listener only knows which origin it stands for from SNI, so a connection
      // that carries none cannot be forwarded anywhere truthful.
      const hostname = scan.servername ?? (listener.hostname.includes('*') ? null : listener.hostname)

      if (!hostname) {
        debug('no servername for wildcard listener %s; closing', listener.hostname)
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
    const upstream = await this.options.connectUpstream({
      hostname: servername,
      port: listener.port,
      alpnProtocols,
      material: listener.material,
    })

    const secureContext = await this.options.secureContextFor(servername)

    browserSocket.pause()

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
