fs         = require("fs")
path       = require("path")
https      = require("https")
Promise    = require("bluebird")
sslRootCas = require('ssl-root-cas')

sslRootCas
.inject()
.addFile(path.join(__dirname, "certs", "server", "my-root-ca.crt.pem"))

options = {
  key: fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.key.pem"))
  cert: fs.readFileSync(path.join(__dirname, "certs", "server", "my-server.crt.pem"))
}

onRequest = (req, res) ->
  console.log "HTTPS SERVER REQUEST URL:", req.url
  console.log "HTTPS SERVER REQUEST HEADERS:", req.headers

  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end("<html><body>https server</body></html>")

servers = []

module.exports = {
  start: (port) ->
    new Promise (resolve) ->
      srv = https.createServer(options, onRequest)

      servers.push(srv)

      srv.listen port, ->
        console.log "server listening on port: #{port}"
        resolve(srv)

  stop: ->
    stop = (srv) ->
      new Promise (resolve) ->
        srv.close(resolve)

    Promise.map(servers, stop)
    .then ->
      servers = []
}
