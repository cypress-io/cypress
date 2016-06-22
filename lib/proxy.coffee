CA     = require("./ca")
Server = require("./server")

module.exports = {
  create: (dir, port) ->
    CA.create(dir)
    .then (ca) ->
      Server.create(ca, port)

}