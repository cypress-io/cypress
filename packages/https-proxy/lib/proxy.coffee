CA     = require("./ca")
Server = require("./server")

module.exports = {
  create: (dir, port, options) ->
    CA.create(dir)
    .then (ca) ->
      Server.create(ca, port, options)

  reset: ->
    Server.reset()

  httpsServer: (onRequest) ->
    require("../test/helpers/https_server").create(onRequest)

}
