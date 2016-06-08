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

srv = https.createServer options, (req, res) ->
  console.log "REQUEST URL:", req.url
  console.log "REQUEST HEADERS:", req.headers

  res.setHeader("Content-Type", "text/html")
  res.writeHead(200)
  res.end("<html><body>https server</body></html")

module.exports = {
  srv: srv

  start: ->
    new Promise (resolve) ->
      srv.listen 8443, ->
        console.log "server listening on port: 8443"
        resolve(srv)

  stop: ->
    new Promise (resolve) ->
      srv.close(resolve)
}
