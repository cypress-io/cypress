require("./util/http_overrides")

_        = require("lodash")
path     = require("path")
repl     = require("repl")
history  = require("repl.history")
Fixtures = require("../spec/server/helpers/fixtures")

replServer = repl.start({
  prompt: "> "
})

## preserve the repl history
history(replServer, path.join(process.env.HOME, ".node_history"))

req = replServer.context.require

getObj = ->
  deploy = require("../deploy")

  return {
    lodash: _
    deploy: deploy
    darwin: deploy.getPlatform("darwin")
    linux:  deploy.getPlatform("linux")
    Fixtures: Fixtures

    reload: ->
      for key of require.cache
        delete require.cache[key]

      for key of req.cache
        delete req.cache[key]

      setContext()

    r: (file) ->
      return require(file)
  }

do setContext = ->
  _.extend replServer.context, getObj()
