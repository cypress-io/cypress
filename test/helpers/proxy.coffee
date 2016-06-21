fs        = require("fs-extra")
net       = require("net")
url       = require("url")
path      = require("path")
http      = require("http")
https     = require("https")
request   = require("request")
Promise   = require("bluebird")
sempahore = require("semaphore")
CA        = require("../../lib/ca")

Promise.promisifyAll(fs)

ca = null
httpsSrv = null
httpsPort = null

sslServers = {}
sslSemaphores = {}

onClientError = (err) ->
  console.log "CLIENT ERROR", err

onError = (err) ->
  console.log "ERROR", err

onRequest = (req, res) ->
  console.log "onRequest!!!!!!!!!"

  request(req.url)
  .on "error", ->
    console.log "**ERROR", req.url
    res.statusCode = 500
    res.end()
  .pipe(res)

onConnect = (req, socket, head) ->
  ## tell the client that the connection is established
  # socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
  #   // creating pipes in both ends
  #   conn.pipe(socket);
  #   socket.pipe(conn);
  # });

  console.log "URL", req.url
  console.log "HEADERS", req.headers
  console.log "HEAD IS", head
  console.log "HEAD LENGTH", head.length

  # srvUrl = url.parse("http://#{req.url}")

  # conn = null

  # cb = ->
  #   socket.write('HTTP/1.1 200 Connection Established\r\n' +
  #                   'Proxy-agent: Cypress\r\n' +
  #                   '\r\n')
  #   conn.write(head)
  #   conn.pipe(socket)
  #   socket.pipe(conn)

  # conn = net.connect(srvUrl.port, srvUrl.hostname, cb)

  # conn.on "error", (err) ->
  #   ## TODO: attach error handling here
  #   console.log "*******ERROR CONNECTING", err, err.stack

  # # conn.on "close", ->
  # #   console.log "CONNECTION CLOSED", arguments

  # return

  # URL www.cypress.io:443
  # HEADERS { host: 'www.cypress.io:443',
  #   'proxy-connection': 'keep-alive',
  #   'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2609.0 Safari/537.36' }
  # HEAD IS <Buffer >
  # HEAD LENGTH 0

  getHttpsServer = (hostname) ->
    onCertificateRequired(hostname)
    .then (certPaths) ->
      Promise.props({
        keyFileExists: fs.statAsync(certPaths.keyFile)
        certFileExists: fs.statAsync(certPaths.certFile)
      })
      .catch (err) ->
        onCertificateMissing(certPaths)
        .then (data = {}) ->
          return {
            key:   data.keyFileData
            cert:  data.certFileData
            hosts: data.hosts
          }
    .then (data = {}) ->
      hosts = [hostname]
      delete data.hosts

      hosts.forEach (host) ->
        console.log "ADD CONTEXT", host, data
        httpsSrv.addContext(host, data)
        # sslServers[host] = { port: httpsPort }

      # return cb(null, self.httpsPort)

      return httpsPort

  onCertificateMissing = (certPaths) ->
    hosts = certPaths.hosts #or [ctx.hostname]

    ca.generateServerCertificateKeys(hosts)
    .spread (certPEM, privateKeyPEM) ->
      return {
        hosts:        hosts
        keyFileData:  privateKeyPEM
        certFileData: certPEM
      }

  onCertificateRequired = (hostname) ->
    Promise.resolve({
      keyFile: ""
      certFile: ""
      hosts: [hostname]
    })

  makeConnection = (port) ->
    console.log "makeConnection", port
    conn = net.connect port, ->
      console.log "connected to", port#, socket, conn, head
      socket.pipe(conn)
      conn.pipe(socket)
      socket.emit("data", head)

      return socket.resume()

    conn.on "error", onError

  onServerConnectData = (head) ->
    console.log "onServerConnectData", head

    firstBytes = head[0]

    console.log "firstBytes", firstBytes

    if firstBytes is 0x16 or firstBytes is 0x80 or firstBytes is 0x00
      {hostname} = url.parse("http://#{req.url}")

      if sslServer = sslServers[hostname]
        return makeConnection(sslServer.port)

      wildcardhost = hostname.replace(/[^\.]+\./, "*.")

      sem = sslSemaphores[wildcardhost]

      if not sem
        sem = sslSemaphores[wildcardhost] = sempahore(1)

      sem.take ->
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

        getHttpsServer(hostname)
        .then (port) ->
          leave()

          makeConnection(port)

    else
      makeConnection(@httpPort)

  if not head or head.length is 0
    socket.once "data", onServerConnectData

    socket.write "HTTP/1.1 200 OK\r\n"

    if req.headers["proxy-connection"] is "keep-alive"
      socket.write("Proxy-Connection: keep-alive\r\n")
      socket.write("Connection: keep-alive\r\n")

    socket.write("\r\n")
  else
    socket.pause()

    onServerConnectData(head)

prx = http.createServer()

prx.on("connect", onConnect)
prx.on("request", onRequest)
prx.on("clientError", onClientError)
prx.on("error", onError)

module.exports = {
  prx: prx

  startHttpsSrv: ->
    new Promise (resolve) ->
      httpsSrv = https.createServer({})
      httpsSrv.timeout = 0
      httpsSrv.on("connect", onConnect)
      httpsSrv.on("request", onRequest)
      httpsSrv.on("clientError", onClientError)
      httpsSrv.on("error", onError)
      httpsSrv.listen ->
        resolve([httpsSrv.address().port, httpsSrv])

  start: ->
    dir = path.join(process.cwd(), "ca")

    CA.create(dir)
    .then (c) =>
      ca = c

      @startHttpsSrv()
    .spread (port, httpsSrv) ->
      httpsPort = port

      new Promise (resolve) ->
        prx.listen 3333, ->
          console.log "server listening on port: 3333"
          resolve(prx)

  stop: ->
    new Promise (resolve) ->
      prx.close(resolve)
}