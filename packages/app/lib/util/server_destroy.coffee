Promise      = require("bluebird")
allowDestroy = require("server-destroy")

module.exports = (server) ->
  allowDestroy(server)

  server.destroyAsync = ->
    Promise.promisify(server.destroy)()
    .catch ->
      ## dont catch any errors
