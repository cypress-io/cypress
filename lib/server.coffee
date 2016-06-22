fs        = require("fs-extra")
net       = require("net")
url       = require("url")
# path    = require("path")
https     = require("https")
Promise   = require("bluebird")
semaphore = require("semaphore")
parse     = require("./util/parse")

fs = Promise.promisifyAll(fs)

sslServers    = {}
sslSemaphores = {}

onError = (err, port) ->
  console.log "ON HTTPS PROXY ERROR", port, err.stack

class Server
  constructor: (@_ca, @_port) ->
    @_onRequestHandler = null

  connect: (req, socket, head, options = {}) ->
    if onReq = options.onRequest
      @_onRequestHandler = onReq

    console.log "ON CONNECT!!!!!!!!!!!!!!!"
    console.log "URL", req.url
    console.log "HEADERS", req.headers
    console.log "HEAD IS", head
    console.log "HEAD LENGTH", head.length

    if not head or head.length is 0
      socket.once "data", (data) =>
        @connect(req, socket, data, options)

      socket.write "HTTP/1.1 200 OK\r\n"

      if req.headers["proxy-connection"] is "keep-alive"
        socket.write("Proxy-Connection: keep-alive\r\n")
        socket.write("Connection: keep-alive\r\n")

      return socket.write("\r\n")

    else
      socket.pause()

      @_onServerConnectData(req, socket, head)

  _onRequest: (req, res) ->
    hostPort = parse.hostAndPort(req.url, req.headers, 443)

    req.url = url.format({
      protocol: "https:"
      hostname: hostPort.host
      port:     hostPort.port
    }) + req.url

    if orh = @_onRequestHandler
      return orh.call(@, req, res)

    console.log "onRequest!!!!!!!!!", req.url, req.headers, req.method

    req.pipe(request(req.url))
    .on "error", ->
      console.log "**ERROR", req.url
      res.statusCode = 500
      res.end()
    .pipe(res)

  _makeConnection: (socket, head, port) ->
    if not port
      err = new Error "missing port!"
      console.log err.stack
      throw err

    conn = net.connect port, ->
      socket.pipe(conn)
      conn.pipe(socket)
      socket.emit("data", head)

      socket.resume()

    ## TODO: handle error!
    conn.on "error", (err) ->
      onError(err, port)

  _onServerConnectData: (req, socket, head) ->
    firstBytes = head[0]

    makeConnection = (port) =>
      @_makeConnection(socket, head, port)

    if firstBytes is 0x16 or firstBytes is 0x80 or firstBytes is 0x00
      {hostname} = url.parse("http://#{req.url}")

      if sslServer = sslServers[hostname]
        console.log "SSL SERVER", sslServer
        return makeConnection(sslServer.port)

      wildcardhost = hostname.replace(/[^\.]+\./, "*.")

      sem = sslSemaphores[wildcardhost]

      if not sem
        sem = sslSemaphores[wildcardhost] = semaphore(1)

      sem.take =>
        leave = ->
          process.nextTick ->
            console.log "leaving sem"
            sem.leave()

        if sslServer = sslServers[hostname]
          leave()
          return makeConnection(sslServer.port)

        if sslServer = sslServers[wildcardhost]
          leave()
          sslServers[hostname] = {
            port: sslServer
          }

          return makeConnection(sslServers[hostname].port)

        @_getPortFor(hostname)
        .then (port) ->
          leave()

          makeConnection(port)

    else
      makeConnection(@_port)

  _getCertificatePathsFor: (hostname) ->
    Promise.resolve({
      keyFile: ""
      certFile: ""
      hosts: [hostname]
    })

  _generateMissingCertificates: (certPaths) ->
    hosts = certPaths.hosts #or [ctx.hostname]

    @_ca.generateServerCertificateKeys(hosts)
    .spread (certPEM, privateKeyPEM) ->
      return {
        hosts:        hosts
        keyFileData:  privateKeyPEM
        certFileData: certPEM
      }

  _getPortFor: (hostname) ->
    @_getCertificatePathsFor(hostname)
    .then (certPaths) =>
      Promise.props({
        keyFileExists: fs.statAsync(certPaths.keyFile)
        certFileExists: fs.statAsync(certPaths.certFile)
      })
      .catch (err) =>
        @_generateMissingCertificates(certPaths)
        .then (data = {}) ->
          return {
            key:   data.keyFileData
            cert:  data.certFileData
            hosts: data.hosts
          }
    .then (data = {}) =>
      hosts = [hostname]
      delete data.hosts

      hosts.forEach (host) =>
        @_sniServer.addContext(host, data)
        sslServers[host] = { port: @_sniPort }

      return @_sniPort

  listen: ->
    new Promise (resolve) =>
      @_sniServer = https.createServer({})
      @_sniServer.on "request", @_onRequest.bind(@)
      @_sniServer.listen =>
        ## store the port of our current sniServer
        @_sniPort = @_sniServer.address().port

        resolve()

  close: ->
    ## TODO: turn this into a promise
    ## and use allow-destroy
    @_sniServer.close()

module.exports = {
  create: (ca, port) ->
    srv = new Server(ca, port)

    srv
    .listen()
    .return(srv)
}