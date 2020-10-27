const _ = require('lodash')
const { allowDestroy, connect } = require('@packages/network')
const debug = require('debug')('cypress:https-proxy')
const https = require('https')
const net = require('net')
const parse = require('./util/parse')
const Promise = require('bluebird')
const semaphore = require('semaphore')
const url = require('url')

let sslServers = {}
let sslIpServers = {}
const sslSemaphores = {}

// https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_record
const SSL_RECORD_TYPES = [
  22, // Handshake
  128, 0, // TODO: what do these unknown types mean?
]

let onError = (err) => {
  // these need to be caught to avoid crashing but do not affect anything
  return debug('server error %o', { err })
}

class Server {
  constructor (_ca, _port, _options) {
    this._getServerPortForIp = this._getServerPortForIp.bind(this)
    this._ca = _ca
    this._port = _port
    this._options = _options
    this._onError = null
    this._ipServers = sslIpServers
  }

  connect (req, browserSocket, head, options = {}) {
    // don't buffer writes - thanks a lot, Nagle
    // https://github.com/cypress-io/cypress/issues/3192
    browserSocket.setNoDelay(true)

    debug('Writing browserSocket connection headers %o', { url: req.url, headLength: _.get(head, 'length'), headers: req.headers })

    browserSocket.on('error', (err) => {
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
      return this._onFirstHeadBytes(req, browserSocket, head, options)
    }

    // else once we get it make the connection later
    return browserSocket.once('data', (data) => {
      return this._onFirstHeadBytes(req, browserSocket, data, options)
    })
  }

  _onFirstHeadBytes (req, browserSocket, head) {
    debug('Got first head bytes %o', { url: req.url, head: _.chain(head).invoke('toString').slice(0, 64).join('').value() })

    browserSocket.pause()

    return this._onServerConnectData(req, browserSocket, head)
  }

  _onUpgrade (fn, req, browserSocket, head) {
    debug('upgrade', req.url)
    if (fn) {
      return fn.call(this, req, browserSocket, head)
    }
  }

  _onRequest (fn, req, res) {
    const hostPort = parse.hostAndPort(req.url, req.headers, 443)

    req.url = url.format({
      protocol: 'https:',
      hostname: hostPort.host,
      port: hostPort.port,
    }) + req.url

    if (fn) {
      return fn.call(this, req, res)
    }
  }

  _makeConnection (browserSocket, head, port, hostname) {
    const onSocket = (err, upstreamSocket) => {
      debug('received upstreamSocket callback for request %o', { port, hostname, err })

      onError = (err) => {
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

    return connect.createRetryingSocket({ port, host: hostname }, onSocket)
  }

  _onServerConnectData (req, browserSocket, head) {
    let sem; let sslServer
    const firstBytes = head[0]

    const makeConnection = (port) => {
      debug('Making intercepted connection to %s', port)

      return this._makeConnection(browserSocket, head, port, 'localhost')
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

    return sem.take(() => {
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

      return this._getPortFor(hostname)
      .then((port) => {
        sslServers[hostname] = { port }

        leave()

        return makeConnection(port)
      })
    })
  }

  _normalizeKeyAndCert (certPem, privateKeyPem) {
    return {
      key: privateKeyPem,
      cert: certPem,
    }
  }

  _getCertificatePathsFor (hostname) {
    return this._ca.getCertificateKeysForHostname(hostname)
    .spread(this._normalizeKeyAndCert)
  }

  _generateMissingCertificates (hostname) {
    return this._ca.generateServerCertificateKeys(hostname)
    .spread(this._normalizeKeyAndCert)
  }

  _getPortFor (hostname) {
    return this._getCertificatePathsFor(hostname)
    .catch((err) => {
      return this._generateMissingCertificates(hostname)
    }).then((data = {}) => {
      if (net.isIP(hostname)) {
        return this._getServerPortForIp(hostname, data)
      }

      this._sniServer.addContext(hostname, data)

      return this._sniPort
    })
  }

  _listenHttpsServer (data) {
    return new Promise((resolve, reject) => {
      const server = https.createServer(data)

      allowDestroy(server)

      server.once('error', reject)
      server.on('upgrade', this._onUpgrade.bind(this, this._options.onUpgrade))
      server.on('request', this._onRequest.bind(this, this._options.onRequest))

      return server.listen(0, '127.0.0.1', () => {
        const {
          port,
        } = server.address()

        server.removeListener('error', reject)
        server.on('error', onError)

        return resolve({ server, port })
      })
    })
  }

  // browsers will not do SNI for an IP address
  // so we need to serve 1 HTTPS server per IP
  // https://github.com/cypress-io/cypress/issues/771
  _getServerPortForIp (ip, data) {
    let server

    server = sslIpServers[ip]

    if (server) {
      return server.address().port
    }

    return this._listenHttpsServer(data)
    .then(({ server, port }) => {
      sslIpServers[ip] = server

      debug('Created IP HTTPS Proxy Server', { port, ip })

      return port
    })
  }

  listen () {
    this._onError = this._options.onError

    return this._listenHttpsServer({})
    .tap(({ server, port }) => {
      this._sniPort = port
      this._sniServer = server

      return debug('Created SNI HTTPS Proxy Server', { port })
    })
  }

  close () {
    const close = () => {
      const servers = _.values(sslIpServers).concat(this._sniServer)

      return Promise.map(servers, (server) => {
        return Promise.fromCallback(server.destroy)
        .catch(onError)
      })
    }

    return close()
    .finally(module.exports.reset)
  }
}

module.exports = {
  reset () {
    sslServers = {}
    sslIpServers = {}
  },

  create (ca, port, options = {}) {
    const srv = new Server(ca, port, options)

    return srv
    .listen()
    .return(srv)
  },
}
