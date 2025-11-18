import _ from 'lodash'
import { allowDestroy, connect, httpUtils } from '@packages/network'
import debugModule from 'debug'
import https from 'https'
import net from 'net'
import { hostAndPort } from './util/parse'
import semaphore from 'semaphore'
import url from 'url'
import type { CA } from './ca'
import type { IncomingMessage, ServerResponse } from 'http'
import type { AddressInfo } from 'net'

type ServerOptions = {
  onUpgrade?: (req: IncomingMessage, browserSocket: net.Socket, head: Buffer) => void | undefined
  onRequest?: (req: IncomingMessage, res: ServerResponse) => void | undefined
  onError?: (err: Error, socket: net.Socket, head: Buffer, port: string) => void
}

const debug = debugModule('cypress:https-proxy')

let sslServers: Record<string, { port: number }> = {}
let sslIpServers: Record<string, https.Server<typeof IncomingMessage, typeof ServerResponse>> = {}
const sslSemaphores: Record<string, semaphore.Semaphore> = {}

// https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_record
const SSL_RECORD_TYPES = [
  22, // Handshake
  128, 0, // TODO: what do these unknown types mean?
]

let onError = (err: Error) => {
  // these need to be caught to avoid crashing but do not affect anything
  return debug('server error %o', { err })
}

export class Server {
  _ca: CA
  _port: number
  _options: ServerOptions
  _onError: (err: Error, browserSocket: net.Socket, head: Buffer, port?: string) => void | null
  _ipServers: Record<string, https.Server<typeof IncomingMessage, typeof ServerResponse>>
  _sniPort: number
  _sniServer: https.Server<typeof IncomingMessage, typeof ServerResponse>

  constructor (_ca: CA, _port: number, _options: ServerOptions) {
    this._ca = _ca
    this._port = _port
    this._options = _options
    this._onError = null
    this._ipServers = sslIpServers
  }

  connect (req: IncomingMessage, browserSocket: net.Socket, head: Buffer) {
    // the SNI server requires a hostname, so if the hostname is blank,
    // destroy the socket and fail fast
    const { hostname } = url.parse(`https://${req.url}`)

    if (!hostname) {
      browserSocket.destroy()

      return debug(`Invalid hostname for request url ${req.url}`)
    }

    // don't buffer writes - thanks a lot, Nagle
    // https://github.com/cypress-io/cypress/issues/3192
    browserSocket.setNoDelay(true)

    debug('Writing browserSocket connection headers %o', { url: req.url, headLength: _.get(head, 'length'), headers: req.headers })

    browserSocket.on('error', (err: Error) => {
      // TODO: shouldn't we destroy the upstream socket here?
      // and also vise versa if the upstream socket throws?
      // we may get this "for free" though because piping will
      // automatically forward the TCP errors...?

      // nothing to do except catch here, the browser has d/c'd
      return debug('received error on client browserSocket %o', {
        err, url: req.url,
      })
    })

    browserSocket.write('HTTP/1.1 200 OK\r\n')

    if (req.headers['proxy-connection'] === 'keep-alive') {
      browserSocket.write('Proxy-Connection: keep-alive\r\n')
      browserSocket.write('Connection: keep-alive\r\n')
    }

    browserSocket.write('\r\n')

    // if we somehow already have the head here
    if (_.get(head, 'length')) {
      // then immediately make up the connection
      return this._onFirstHeadBytes(req, browserSocket, head)
    }

    // else once we get it make the connection later
    return browserSocket.once('data', (data) => {
      return this._onFirstHeadBytes(req, browserSocket, data)
    })
  }

  _onFirstHeadBytes (req: IncomingMessage, browserSocket: net.Socket, head: Buffer) {
    // @ts-expect-error
    debug('Got first head bytes %o', { url: req.url, head: _.chain(head).invoke('toString').slice(0, 64).join('').value() })

    browserSocket.pause()

    return this._onServerConnectData(req, browserSocket, head)
  }

  _onUpgrade (fn: (req: IncomingMessage, browserSocket: net.Socket, head: Buffer) => void | undefined, req: IncomingMessage, browserSocket: net.Socket, head: Buffer) {
    debug('upgrade', req.url)
    if (fn) {
      return fn.call(this, req, browserSocket, head)
    }
  }

  _onRequest (fn: (req: IncomingMessage, res: ServerResponse) => void | undefined, req: IncomingMessage, res: ServerResponse) {
    const hostPort = hostAndPort(req.url, req.headers, 443)

    req.url = url.format({
      protocol: 'https:',
      hostname: hostPort.host,
      port: hostPort.port,
    }) + req.url

    if (fn) {
      return fn.call(this, req, res)
    }
  }

  _makeConnection (browserSocket: net.Socket, head: Buffer, port: string, hostname: string) {
    const onSocket = (err: Error, upstreamSocket: net.Socket) => {
      debug('received upstreamSocket callback for request %o', { port, hostname, err })

      onError = (err: Error) => {
        browserSocket.destroy(err)

        if (this._onError) {
          return this._onError(err, browserSocket, head, port)
        }
      }

      if (err) {
        return onError(err)
      }

      upstreamSocket.setNoDelay(true)
      upstreamSocket.on('error', onError)

      browserSocket.emit('upstream-connected', upstreamSocket)

      browserSocket.pipe(upstreamSocket)
      upstreamSocket.pipe(browserSocket)
      upstreamSocket.write(head)

      return browserSocket.resume()
    }

    if (!port) {
      port = '443'
    }

    // @ts-expect-error
    return connect.createRetryingSocket({ port: Number(port), host: hostname }, onSocket)
  }

  _onServerConnectData (req: IncomingMessage, browserSocket: net.Socket, head: Buffer) {
    let sem: semaphore.Semaphore | undefined
    let sslServer: { port: number } | undefined
    const firstBytes = head[0]

    const makeConnection = (port: number) => {
      debug('Making intercepted connection to %s', port)

      return this._makeConnection(browserSocket, head, port.toString(), 'localhost')
    }

    if (!SSL_RECORD_TYPES.includes(firstBytes)) {
      // if this isn't an SSL request then go
      // ahead and make the connection now
      return makeConnection(this._port)
    }

    // else spin up the SNI server
    const { hostname } = url.parse(`https://${req.url}`)

    sslServer = sslServers[hostname]

    if (sslServer) {
      return makeConnection(sslServer.port)
    }

    // only be creating one SSL server per hostname at once
    if (!(sem = sslSemaphores[hostname])) {
      sem = (sslSemaphores[hostname] = semaphore(1))
    }

    return sem.take(async () => {
      const leave = () => {
        return process.nextTick(() => {
          return sem.leave()
        })
      }

      sslServer = sslServers[hostname]

      if (sslServer) {
        leave()

        return makeConnection(sslServer.port)
      }

      let port: number

      try {
        try {
          port = await this._getPortFor(hostname)
        } catch (err) {
          debug('Error adding context, deleting certs and regenning %o', { hostname, err })

          // files on disk can be corrupted, so try again
          // @see https://github.com/cypress-io/cypress/issues/8705
          await this._ca.clearDataForHostname(hostname)

          port = await this._getPortFor(hostname)
        }

        sslServers[hostname] = { port }

        leave()

        return makeConnection(port)
      } catch (e) {
        debug('Error making connection %o', { e })

        browserSocket.destroy(e)

        leave()

        if (this._onError) {
          return this._onError(e, browserSocket, head)
        }
      }
    })
  }

  _normalizeKeyAndCert (certPem: string, privateKeyPem: string): { key: string, cert: string } {
    return {
      key: privateKeyPem,
      cert: certPem,
    }
  }

  async _getCertificatePathsFor (hostname: string): Promise<{ key: string, cert: string }> {
    const [certPem, privateKeyPem] = await this._ca.getCertificateKeysForHostname(hostname)

    return this._normalizeKeyAndCert(certPem, privateKeyPem)
  }

  async _generateMissingCertificates (hostname: string): Promise<{ key: string, cert: string }> {
    const [certPem, privateKeyPem] = await this._ca.generateServerCertificateKeys(hostname)

    return this._normalizeKeyAndCert(certPem, privateKeyPem)
  }

  async _getPortFor (hostname: string): Promise<number> {
    let data: {
      key: string
      cert: string
    }

    try {
      data = await this._getCertificatePathsFor(hostname)
    } catch (err) {
      data = await this._generateMissingCertificates(hostname)
    }

    if (net.isIP(hostname)) {
      return this._getServerPortForIp(hostname, data)
    }

    this._sniServer.addContext(hostname, data)

    return this._sniPort
  }

  _listenHttpsServer (data: { key?: string, cert?: string }): Promise<{ server: https.Server<typeof IncomingMessage, typeof ServerResponse>, port: number }> {
    return new Promise((resolve, reject) => {
      const server = https.createServer({
        ...data,
        ...httpUtils.lenientOptions,
      })

      allowDestroy(server)

      server.once('error', reject)
      server.on('upgrade', this._onUpgrade.bind(this, this._options.onUpgrade))
      server.on('request', this._onRequest.bind(this, this._options.onRequest))

      return server.listen(0, '127.0.0.1', () => {
        const {
          port,
        } = server.address() as AddressInfo

        server.removeListener('error', reject)
        server.on('error', onError)

        return resolve({ server, port })
      })
    })
  }

  // browsers will not do SNI for an IP address
  // so we need to serve 1 HTTPS server per IP
  // https://github.com/cypress-io/cypress/issues/771
  async _getServerPortForIp (ip: string, data: { key: string, cert: string }): Promise<number> {
    const sslServer = sslIpServers[ip]

    if (sslServer) {
      return (sslServer.address() as AddressInfo).port
    }

    const { server, port } = await this._listenHttpsServer(data)

    sslIpServers[ip] = server

    debug('Created IP HTTPS Proxy Server', { port, ip })

    return port
  }

  async listen () {
    this._onError = this._options.onError

    const { server, port } = await this._listenHttpsServer({})

    this._sniPort = port
    this._sniServer = server

    return debug('Created SNI HTTPS Proxy Server', { port })
  }

  close = async (): Promise<void> => {
    const close = async () => {
      const servers = _.values(sslIpServers).concat(this._sniServer)

      await Promise.all(servers.map((server) => {
        return new Promise<void>((resolve) => {
          server.destroy((err: Error | undefined) => {
            if (err) {
              onError(err)
            }

            resolve()
          })
        })
      }))
    }

    try {
      await close()
    } finally {
      reset()
    }

    return undefined
  }
}

export function reset () {
  sslServers = {}
  sslIpServers = {}
}

export async function create (ca: CA, port: number, options: ServerOptions) {
  const srv = new Server(ca, port, options)

  await srv.listen()

  return srv
}
