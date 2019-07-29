http       = require("http")
path       = require("path")
httpsProxy = require("../../lib/proxy")

## can't use server-destroy-vvo here - it doesn't listen for secureConnection events
addDestroy = (server) =>
  connections = []

  trackConn = (conn) =>
    connections.push(conn)

    conn.on 'close', ->
      connections = connections.filter((connection) => connection != conn)

  server.on('connection', trackConn)
  server.on('secureConnection', trackConn)

  server.destroy = (cb) ->
    server.close(cb)
    connections.map((connection) => connection.destroy())

prx = null

pipe = (req, res) ->
  req.pipe(request(req.url))
  .on "error", ->
    console.log "**ERROR**", req.url
    req.statusCode = 500
    res.end()
  .pipe(res)

onConnect = (req, socket, head, proxy) ->
  proxy.connect(req, socket, head, {
    onDirectConnection: (req, socket, head) ->
      ["localhost:8444", "localhost:12344"].includes(req.url)
  })

onRequest = (req, res) ->
  pipe(req, res)

module.exports = {
  reset: ->
    httpsProxy.reset()

  start: (port) ->
    prx = http.createServer()

    addDestroy(prx)

    dir = path.join(process.cwd(), "ca")

    httpsProxy.create(dir, port, {
      onUpgrade: (req, socket, head) ->

      onRequest: (req, res) ->
        console.log "ON REQUEST FROM OUTER PROXY", req.url, req.headers, req.method

        if req.url.includes("replace")
          write = res.write
          res.write = (chunk) ->
            chunk = Buffer.from(chunk.toString().replace("https server", "replaced content"))

            write.call(@, chunk)

          pipe(req, res)
        else
          pipe(req, res)
    })
    .then (proxy) =>
      prx.on "request", onRequest

      prx.on "connect", (req, socket, head) ->
        onConnect(req, socket, head, proxy)

      new Promise (resolve) ->
        prx.listen port, ->
          prx.proxy = proxy
          console.log "server listening on port: #{port}"
          resolve(proxy)

  stop: ->
    new Promise (resolve) ->
      prx.destroy(resolve)
    .then ->
      prx.proxy.close()
}
