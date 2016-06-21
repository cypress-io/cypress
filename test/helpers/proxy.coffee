http       = require("http")
path       = require("path")
httpsProxy = require("../../lib/proxy")

prx = null

onConnect = (req, socket, head, proxy) ->
  proxy.connect(req, socket, head)

onRequest = (req, res) ->
  req.pipe(request(req.url))
  .on "error", ->
    console.log "**ERROR", req.url
    res.statusCode = 500
    res.end()
  .pipe(res)

module.exports = {
  start: ->
    dir = path.join(process.cwd(), "ca")

    prx = http.createServer()

    httpsProxy.create(dir)
    .then (proxy) =>
      prx.on "request", onRequest

      prx.on "connect", (req, socket, head) ->
        onConnect(req, socket, head, proxy)

      new Promise (resolve) ->
        prx.listen 3333, ->
          console.log "server listening on port: 3333"
          resolve(prx)

  stop: ->
    new Promise (resolve) ->
      prx.close(resolve)
}