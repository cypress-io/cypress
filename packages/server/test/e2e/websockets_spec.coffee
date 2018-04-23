ws = require("ws")

e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/foo", (req, res) ->
    res.send("<html>foo></html>")

onWsServer = (app, server) ->
  wss = new ws.Server({ server })
  wss.on "connection", (ws) ->
    ws.on "message", (msg) ->
      ws.send(msg + "bar")

describe "e2e websockets", ->
  e2e.setup({
    servers: [{
      port: 3838
      static: true
      onServer: onServer
    }, {
      port: 3939
      onServer: onWsServer
    }]
  })

  ## https://github.com/cypress-io/cypress/issues/556
  it "passes", ->
    e2e.exec(@, {
      spec: "websockets_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
