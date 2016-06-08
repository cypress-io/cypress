http      = require("http")
request   = require("request")
Promise   = require("bluebird")
sempahore = require("semaphore")

sslServers = {}
sslSemaphores = {}

onRequest = (req, res) ->
  request(req.url).pipe(res)

prx = http.createServer(onRequest)

module.exports = {
  prx: prx

  start: ->
    new Promise (resolve) ->
      prx.listen 2222, ->
        console.log "server listening on port: 2222"
        resolve(prx)

  stop: ->
    new Promise (resolve) ->
      prx.close(resolve)
}