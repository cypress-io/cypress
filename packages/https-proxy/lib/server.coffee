_            = require("lodash")
agent        = require("@packages/network").agent
allowDestroy = require("server-destroy-vvo")
debug        = require("debug")("cypress:https-proxy")
fs           = require("fs-extra")
getProxyForUrl = require("proxy-from-env").getProxyForUrl
https        = require("https")
net          = require("net")
parse        = require("./util/parse")
Promise      = require("bluebird")
semaphore    = require("semaphore")
url          = require("url")

fs = Promise.promisifyAll(fs)

sslServers    = {}
sslSemaphores = {}

## https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_record
SSL_RECORD_TYPES = [
  22 ## Handshake
  128, 0 ## TODO: what do these unknown types mean?
]

class Server
  constructor: (@_ca, @_port) ->
    @_onError = null

  connect: (req, socket, head, options = {}) ->
    ## don't buffer writes - thanks a lot, Nagle
    ## https://github.com/cypress-io/cypress/issues/3192
    socket.setNoDelay(true)

    if not head or head.length is 0
      debug("Writing socket connection headers for URL:", req.url)

      socket.once "data", (data) =>
        @connect(req, socket, data, options)

      socket.write "HTTP/1.1 200 OK\r\n"

      if req.headers["proxy-connection"] is "keep-alive"
        socket.write("Proxy-Connection: keep-alive\r\n")
        socket.write("Connection: keep-alive\r\n")

      return socket.write("\r\n")

    else
      if odc = options.onDirectConnection
        ## if onDirectConnection return true
        ## then dont proxy, just pass this through
        if odc.call(@, req, socket, head) is true
          return @_makeDirectConnection(req, socket, head)
        else
          debug("Not making direct connection to #{req.url}")

      socket.pause()

      @_onServerConnectData(req, socket, head)

  _onUpgrade: (fn, req, socket, head) ->
    if fn
      fn.call(@, req, socket, head)

  _onRequest: (fn, req, res) ->
    hostPort = parse.hostAndPort(req.url, req.headers, 443)

    req.url = url.format({
      protocol: "https:"
      hostname: hostPort.host
      port:     hostPort.port
    }) + req.url

    if fn
      return fn.call(@, req, res)

    req.pipe(request(req.url))
    .on "error", ->
      res.statusCode = 500
      res.end()
    .pipe(res)

  _upstreamProxyForHostPort: (hostname, port) ->
    getProxyForUrl("https://#{hostname}:#{port}")

  _makeDirectConnection: (req, socket, head) ->
    { port, hostname } = url.parse("http://#{req.url}")

    if upstreamProxy = @_upstreamProxyForHostPort(hostname, port)
      return @_makeUpstreamProxyConnection(upstreamProxy, socket, head, port, hostname)

    debug("Making direct connection to #{hostname}:#{port}")
    @_makeConnection(socket, head, port, hostname)

  _makeConnection: (socket, head, port, hostname) ->
    onConnect = ->
      socket.pipe(conn)
      conn.pipe(socket)
      conn.write(head)

      socket.resume()

    conn = new net.Socket()
    conn.setNoDelay(true)

    conn.on "error", (err) =>
      if @_onError
        @_onError(err, socket, head, port)

    ## compact out hostname when undefined
    args = _.compact([port, hostname, onConnect])
    conn.connect.apply(conn, args)

  # todo: as soon as all requests are intercepted, this can go away since this is just for pass-through
  _makeUpstreamProxyConnection: (upstreamProxy, socket, head, toPort, toHostname) ->
    debug("making proxied connection to #{toHostname}:#{toPort} with upstream #{upstreamProxy}")

    onUpstreamSock = (err, upstreamSock) ->
      if @_onError
        if err
          return @_onError(err, socket, head, port)
        upstreamSock.on "error", (err) =>
          @_onError(err, socket, head, port)

      if not upstreamSock
        ## couldn't establish a proxy connection, fail gracefully
        socket.resume()
        return socket.destroy()

      upstreamSock.setNoDelay(true)
      upstreamSock.pipe(socket)
      socket.pipe(upstreamSock)
      upstreamSock.write(head)

      socket.resume()

    agent.httpsAgent.createProxiedConnection {
      proxy: upstreamProxy
      href: "https://#{toHostname}:#{toPort}"
      uri: {
        port: toPort
        hostname: toHostname
      }
    }, onUpstreamSock.bind(@)

  _onServerConnectData: (req, socket, head) ->
    firstBytes = head[0]

    makeConnection = (port) =>
      debug("Making intercepted connection to %s", port)

      @_makeConnection(socket, head, port)

    if firstBytes in SSL_RECORD_TYPES
      {hostname} = url.parse("http://#{req.url}")

      if sslServer = sslServers[hostname]
        return makeConnection(sslServer.port)

      ## only be creating one SSL server per hostname at once
      if not sem = sslSemaphores[hostname]
        sem = sslSemaphores[hostname] = semaphore(1)

      sem.take =>
        leave = ->
          process.nextTick ->
            sem.leave()

        if sslServer = sslServers[hostname]
          leave()

          return makeConnection(sslServer.port)

        @_getPortFor(hostname)
        .then (port) ->
          sslServers[hostname] = { port: port }

          leave()

          makeConnection(port)

    else
      makeConnection(@_port)

  _normalizeKeyAndCert: (certPem, privateKeyPem) ->
    return {
      key:  privateKeyPem
      cert: certPem
    }

  _getCertificatePathsFor: (hostname) ->
    @_ca.getCertificateKeysForHostname(hostname)
    .spread(@_normalizeKeyAndCert)

  _generateMissingCertificates: (hostname) ->
    @_ca.generateServerCertificateKeys(hostname)
    .spread(@_normalizeKeyAndCert)

  _getPortFor: (hostname) ->
    @_getCertificatePathsFor(hostname)

    .catch (err) =>
      @_generateMissingCertificates(hostname)

    .then (data = {}) =>
      @_sniServer.addContext(hostname, data)

      return @_sniPort

  listen: (options = {}) ->
    new Promise (resolve) =>
      @_onError = options.onError

      @_sniServer = https.createServer({})

      allowDestroy(@_sniServer)

      @_sniServer.on "upgrade", @_onUpgrade.bind(@, options.onUpgrade)
      @_sniServer.on "request", @_onRequest.bind(@, options.onRequest)
      @_sniServer.listen 0, '127.0.0.1', =>
        ## store the port of our current sniServer
        @_sniPort = @_sniServer.address().port

        debug("Created SNI HTTPS Proxy on port %s", @_sniPort)

        resolve()

  close: ->
    close = =>
      new Promise (resolve) =>
        @_sniServer.destroy(resolve)

    close()
    .finally ->
      sslServers = {}

module.exports = {
  reset: ->
    sslServers = {}

  create: (ca, port, options = {}) ->
    srv = new Server(ca, port)

    srv
    .listen(options)
    .return(srv)
}
