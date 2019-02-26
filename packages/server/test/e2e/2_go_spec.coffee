e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/first", (req, res) ->
    res.send("<html><h1>first</h1><a href='/second'>second</a></html>")

  app.get "/second", (req, res) ->
    res.send("<html><h1>second</h1></html>")

describe "e2e go", ->
  e2e.setup({
    servers: {
      port: 1818
      onServer: onServer
    }
  })

  it "passes", ->
    ## this tests that history changes work as intended
    ## there have been regressions in electron which would
    ## otherwise cause these tests to fail

    e2e.exec(@, {
      spec: "go_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
