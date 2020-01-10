https = require("https")
Promise = require("bluebird")
{ allowDestroy } = require("@packages/network")
certs = require("./certs")

defaultOnRequest = (req, res) ->
  console.log "HTTPS SERVER REQUEST URL:", req.url
  console.log "HTTPS SERVER REQUEST HEADERS:", req.headers

  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end("<html><head></head><body>https server</body></html>")

servers = []

create = (onRequest) ->
  https.createServer(certs, onRequest ? defaultOnRequest)

module.exports = {
  create

  start: (port, onRequest) ->
    new Promise (resolve) ->
      srv = create(onRequest)

      allowDestroy(srv)

      servers.push(srv)

      srv.listen port, ->
        console.log "server listening on port: #{port}"
        resolve(srv)

  stop: ->
    stop = (srv) ->
      new Promise (resolve) ->
        srv.destroy(resolve)

    Promise.map(servers, stop)
    .then ->
      servers = []
}
