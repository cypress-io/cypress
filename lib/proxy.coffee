CA     = require("./ca")
Server = require("./server")

module.exports = {
  create: (dir) ->
    CA.create(dir)
    .then (ca) ->
      Server.create(ca)

}