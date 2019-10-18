_            = require("lodash")
{ agent, allowDestroy, connect } = require("@packages/network")
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
sslIpServers  = {}
sslSemaphores = {}

## https://en.wikipedia.org/wiki/Transport_Layer_Security#TLS_record
SSL_RECORD_TYPES = [
  22 ## Handshake
  128, 0 ## TODO: what do these unknown types mean?
]

onError = (err) ->
  ## these need to be caught to avoid crashing but do not affect anything
  debug('server error %o', { err })

class Server
  constructor: (@_ca, @_port, @_options) ->
    @_onError = null
    @_ipServers = sslIpServers

  connect: (req, browserSocket, head, options = {}) ->
    ## don't buffer writes - thanks a lot, Nagle
    ## https://github.com/cypress-io/cypress/issues/3192
    browserSocket.setNoDelay(true)

    debug("Writing browserSocket connection headers %o", { url: req.url, headLength: _.get(head, 'length'), headers: req.headers })

    browserSocket.on "error", (err) =>
      ## TODO: shouldn't we destroy the upstream socket here?
      ## and also vise versa if the upstream socket throws?
      ## we may get this "for free" though because piping will
      ## automatically forward the TCP errors...?

      ## nothing to do except catch here, the browser has d/c'd
      debug("received error on client browserSocket %o", {
        err, url: req.url
      })

    browserSocket.write "HTTP/1.1 200 OK\r\n"

    if req.headers["proxy-connection"] is "keep-alive"
      browserSocket.write("Proxy-Connection: keep-alive\r\n")
      browserSocket.write("Connection: keep-alive\r\n")

    browserSocket.write("\r\n")

    ## if we somehow already have the head here
    if _.get(head, "length")
      ## then immediately make up the connection
      return @_onFirstHeadBytes(req, browserSocket, head, options)

    ## else once we get it make the connection later
    browserSocket.once "data", (data) =>
      @_onFirstHeadBytes(req, browserSocket, data, options)

  _onFirstHeadBytes: (req, browserSocket, head, options) ->
    debug("Got first head bytes %o", { url: req.url, head: _.chain(head).invoke('toString').slice(0, 64).join('').value() })

    browserSocket.pause()

    if odc = options.onDirectConnection
      ## if onDirectConnection return true
      ## then dont proxy, just pass this through
      if odc.call(@, req, browserSocket, head) is true
        return @_makeDirectConnection(req, browserSocket, head)
      else
        debug("Not making direct connection %o", { url: req.url })

    @_onServerConnectData(req, browserSocket, head)

  _onUpgrade: (fn, req, browserSocket, head) ->
    if fn
      fn.call(@, req, browserSocket, head)

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

  _getProxyForUrl: (urlStr) ->
    port = Number(_.get(url.parse(urlStr), 'port'))

    debug('getting proxy URL %o', { port, serverPort: @_port, sniPort: @_sniPort, url: urlStr })

    if [@_sniPort, @_port].includes(port)
      ## https://github.com/cypress-io/cypress/issues/4257
      ## this is a tunnel to the SNI server or to the main server,
      ## it should never go through a proxy
      return undefined

    getProxyForUrl(urlStr)

  _makeDirectConnection: (req, browserSocket, head) ->
    { port, hostname } = url.parse("https://#{req.url}")

    debug("Making connection to #{hostname}:#{port}")
    @_makeConnection(browserSocket, head, port, hostname)

  _makeConnection: (browserSocket, head, port, hostname) ->
    onSocket = (err, upstreamSocket) =>
      debug('received upstreamSocket callback for request %o', { port, hostname, err })

      onError = (err) =>
        browserSocket.destroy(err)

        if @_onError
          @_onError(err, browserSocket, head, port)

      if err
        return onError(err)

      upstreamSocket.setNoDelay(true)
      upstreamSocket.on "error", onError

      browserSocket.pipe(upstreamSocket)
      upstreamSocket.pipe(browserSocket)
      upstreamSocket.write(head)

      browserSocket.resume()

    port or= "443"

    if upstreamProxy = @_getProxyForUrl("https://#{hostname}:#{port}")
      # todo: as soon as all requests are intercepted, this can go away since this is just for pass-through
      debug("making proxied connection %o", {
        host: "#{hostname}:#{port}",
        proxy: upstreamProxy,
      })

      return agent.httpsAgent.createUpstreamProxyConnection {
        proxy: upstreamProxy
        href: "https://#{hostname}:#{port}"
        uri: {
          port
          hostname
        }
        shouldRetry: true
      }, onSocket

    return connect.createRetryingSocket({ port, host: hostname }, onSocket)

  _onServerConnectData: (req, browserSocket, head) ->
    firstBytes = head[0]

    makeConnection = (port) =>
      debug("Making intercepted connection to %s", port)

      @_makeConnection(browserSocket, head, port, "localhost")

    if firstBytes not in SSL_RECORD_TYPES
      ## if this isn't an SSL request then go
      ## ahead and make the connection now
      return makeConnection(@_port)

    ## else spin up the SNI server
    { hostname } = url.parse("https://#{req.url}")

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
      if net.isIP(hostname)
        return @_getServerPortForIp(hostname, data)

      @_sniServer.addContext(hostname, data)

      return @_sniPort

  _listenHttpsServer: (data) ->
    new Promise (resolve, reject) =>
      server = https.createServer(data)

      allowDestroy(server)

      server.once "error", reject
      server.on "upgrade", @_onUpgrade.bind(@, @_options.onUpgrade)
      server.on "request", @_onRequest.bind(@, @_options.onRequest)

      server.listen 0, '127.0.0.1', =>
        port = server.address().port

        server.removeListener("error", reject)
        server.on "error", onError

        resolve({ server, port })

  ## browsers will not do SNI for an IP address
  ## so we need to serve 1 HTTPS server per IP
  ## https://github.com/cypress-io/cypress/issues/771
  _getServerPortForIp: (ip, data) =>
    if server = sslIpServers[ip]
      return server.address().port

    @_listenHttpsServer(data)
    .then ({ server, port }) ->
      sslIpServers[ip] = server

      debug("Created IP HTTPS Proxy Server", { port, ip })

      return port

  listen: ->
    @_onError = @_options.onError

    @_listenHttpsServer({})
    .tap ({ server, port}) =>
      @_sniPort = port
      @_sniServer = server

      debug("Created SNI HTTPS Proxy Server", { port })

  close: ->
    close = =>
      servers = _.values(sslIpServers).concat(@_sniServer)
      Promise.map servers, (server) =>
        Promise.fromCallback(server.destroy)
        .catch onError

    close()
    .finally(module.exports.reset)

module.exports = {
  reset: ->
    sslServers = {}
    sslIpServers = {}

  create: (ca, port, options = {}) ->
    srv = new Server(ca, port, options)

    srv
    .listen()
    .return(srv)
}
