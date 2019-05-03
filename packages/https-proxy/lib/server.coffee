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

MAX_REQUEST_RETRIES = 4

getDelayForRetry = (iteration, err) ->
  increment = 1000
  if err && err.code == 'ECONNREFUSED'
    increment = 100
  _.get([0, 1, 2, 2], iteration) * increment

isRetriableError = (err = {}) ->
  err.fromProxy || ['ECONNREFUSED', 'ECONNRESET', 'EPIPE', 'EHOSTUNREACH', 'EAI_AGAIN'].includes(err.code)

class Server
  constructor: (@_ca, @_port) ->
    @_onError = null

  connect: (req, browserSocket, head, options = {}) ->
    ## don't buffer writes - thanks a lot, Nagle
    ## https://github.com/cypress-io/cypress/issues/3192
    browserSocket.setNoDelay(true)

    if not head or head.length is 0
      debug("Writing browserSocket connection headers for URL:", req.url)

      browserSocket.on "error", (err) =>
        ## nothing to do except catch here, the browser has d/c'd
        debug("received error on client browserSocket", { err })

      browserSocket.once "data", (data) =>
        @connect(req, browserSocket, data, options)

      browserSocket.write "HTTP/1.1 200 OK\r\n"

      if req.headers["proxy-connection"] is "keep-alive"
        browserSocket.write("Proxy-Connection: keep-alive\r\n")
        browserSocket.write("Connection: keep-alive\r\n")

      return browserSocket.write("\r\n")

    else
      if odc = options.onDirectConnection
        ## if onDirectConnection return true
        ## then dont proxy, just pass this through
        if odc.call(@, req, browserSocket, head) is true
          return @_makeDirectConnection(req, browserSocket, head)
        else
          debug("Not making direct connection to #{req.url}")

      browserSocket.pause()

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

  _upstreamProxyForHostPort: (hostname, port) ->
    getProxyForUrl("https://#{hostname}:#{port}")

  _makeDirectConnection: (req, browserSocket, head) ->
    { port, hostname } = url.parse("http://#{req.url}")

    if upstreamProxy = @_upstreamProxyForHostPort(hostname, port)
      return @_makeUpstreamProxyConnection(upstreamProxy, browserSocket, head, port, hostname)

    debug("Making direct connection to #{hostname}:#{port}")
    @_makeConnection(browserSocket, head, port, hostname)

  _makeConnection: (browserSocket, head, port, hostname) ->
    connected = false

    tryConnect = (iteration = 0) =>
      retried = false

      upstreamSocket = new net.Socket()
      upstreamSocket.setNoDelay(true)

      onError = (err) =>
        if retried
          return debug('received second error on errored-out browserSocket %o', { iteration, hostname, port, err })

        if connected
          return debug("error received on https browserSocket after connection established %o", { hostname, port, err })

        if iteration < MAX_REQUEST_RETRIES && isRetriableError(err)
          retried = true
          delay = getDelayForRetry(iteration, err)
          debug('re-trying request on failure %o', { delay, iteration, err })
          return setTimeout ->
            tryConnect(iteration + 1)
          , delay

        debug('browserSocket error irrecoverable, ending upstream socket and not retrying %o', { err })

        browserSocket.destroy(err)

        if @_onError
          @_onError(err, browserSocket, head, port)

      onConnect = ->
        connected = true

        browserSocket.pipe(upstreamSocket)
        upstreamSocket.pipe(browserSocket)
        upstreamSocket.write(head)

        browserSocket.resume()

      upstreamSocket.on "error", onError

      ## compact out hostname when undefined
      args = _.compact([port, hostname, onConnect])
      upstreamSocket.connect.apply(upstreamSocket, args)

    tryConnect()

  # todo: as soon as all requests are intercepted, this can go away since this is just for pass-through
  _makeUpstreamProxyConnection: (upstreamProxy, browserSocket, head, toPort, toHostname) ->
    debug("making proxied connection to #{toHostname}:#{toPort} with upstream #{upstreamProxy}")

    onUpstreamSock = (err, upstreamSock) =>
      if err
        browserSocket.destroy()

      if @_onError
        if err
          return @_onError(err, browserSocket, head, toPort)
        upstreamSock.on "error", (err) =>
          @_onError(err, browserSocket, head, toPort)

      upstreamSock.setNoDelay(true)
      upstreamSock.pipe(browserSocket)
      browserSocket.pipe(upstreamSock)
      upstreamSock.write(head)

      browserSocket.resume()

    tryConnect = (iteration = 0) =>
      agent.httpsAgent.createProxiedConnection {
        proxy: upstreamProxy
        href: "https://#{toHostname}:#{toPort}"
        uri: {
          port: toPort
          hostname: toHostname
        }
      }, (err, upstreamSock) =>
        if err
          if isRetriableError(err) && iteration < MAX_REQUEST_RETRIES
            delay = getDelayForRetry(iteration, err)
            debug('re-trying request on failure %o', { delay, iteration, err })
            debugger
            setTimeout ->
              tryConnect(iteration + 1)
            , delay
        debugger
        onUpstreamSock(err, upstreamSock)

    tryConnect()

  _onServerConnectData: (req, browserSocket, head) ->
    firstBytes = head[0]

    makeConnection = (port) =>
      debug("Making intercepted connection to %s", port)

      @_makeConnection(browserSocket, head, port)

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
