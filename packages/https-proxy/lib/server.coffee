_            = require("lodash")
fs           = require("fs-extra")
net          = require("net")
url          = require("url")
getProxyFromURI = require("request/lib/getProxyFromURI")
https        = require("https")
httpsAgent   = require("https-proxy-agent")
Promise      = require("bluebird")
semaphore    = require("semaphore")
allowDestroy = require("server-destroy-vvo")
debug        = require("debug")("cypress:https-proxy")
parse        = require("./util/parse")

fs = Promise.promisifyAll(fs)

sslServers    = {}
sslSemaphores = {}

class Server
  constructor: (@_ca, @_port) ->
    @_onError = null
    @httpsAgents = {}

  connect: (req, socket, head, options = {}) ->
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

  _needsUpstreamProxy: (hostname, port) ->
    hostname isnt "localhost" or getProxyFromURI("https://#{hostname}:#{port}")

  _makeDirectConnection: (req, socket, head) ->
    { port, hostname } = url.parse("http://#{req.url}")

    if @_needsUpstreamProxy(hostname, port)
      upstreamProxy = process.env.HTTP_PROXY
      return @_makeUpstreamProxyConnection(upstreamProxy, socket, head, port, hostname)

    debug("Making direct connection to #{hostname}:#{port}")
    @_makeConnection(socket, head, port, hostname)

  _makeConnection: (socket, head, port, hostname) ->
    onConnect = ->
      socket.pipe(conn)
      conn.pipe(socket)
      socket.emit("data", head)

      socket.resume()

    ## compact out hostname when undefined
    args = _.compact([port, hostname, onConnect])

    conn = net.connect.apply(net, args)

    conn.on "error", (err) =>
      if @_onError
        @_onError(err, socket, head, port)

  _makeUpstreamProxyConnection: (upstreamProxy, socket, head, toPort, toHostname) ->
    debug("making proxied connection to #{toHostname}:#{toPort} with upstream #{upstreamProxy}")

    if not @httpsAgents[upstreamProxy]
      @httpsAgents[upstreamProxy] = new httpsAgent(upstreamProxy)

    agent = @httpsAgents[upstreamProxy]
    agent.callback {}, {
      port: toPort
      host: toHostname
    }, (err, upstreamSock) ->
      if @_onError and err
        return @_onError(err, socket, head, port)

      upstreamSock.on "error", (err) =>
        @_onError(err, socket, head, port)

      upstreamSock.pipe(socket)
      socket.pipe(upstreamSock)
      socket.emit("data", head)

      socket.resume()

  _onServerConnectData: (req, socket, head) ->
    firstBytes = head[0]

    makeConnection = (port) =>
      debug("Making intercepted connection to %s", port)

      @_makeConnection(socket, head, port)

    if firstBytes is 0x16 or firstBytes is 0x80 or firstBytes is 0x00
      {hostname} = url.parse("http://#{req.url}")

      if sslServer = sslServers[hostname]
        return makeConnection(sslServer.port)

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
      @_sniServer.listen =>
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
