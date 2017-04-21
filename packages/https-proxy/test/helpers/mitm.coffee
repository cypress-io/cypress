Promise = require("bluebird")

Proxy = require("http-mitm-proxy")
proxy = Proxy()

proxy.onRequest (ctx, cb) ->
  cb()

module.exports = {
  start: ->
    new Promise (resolve) ->
      proxy.listen({port: 8081, forceSNI: true}, resolve)

  stop: ->
    proxy.close()

}