child_process  = require("child_process")
open           = require("open")
Promise        = require("bluebird")
config         = require("./config")
Server         = require("./server")

## this class can go away and we can boot
## a project directly now
class Booter
  constructor: (projectRoot) ->
    if not (@ instanceof Booter)
      return new Booter(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/cypress requires a projectRoot!")

    @projectRoot = projectRoot
    @child       = null

  boot: (options = {}) ->
    @server = Server(@projectRoot)

    @server.open(options).bind(@)
    .then (settings) ->
      {server: @server, settings: settings}

  close: ->
    @server.close()

module.exports = Booter