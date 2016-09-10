path       = require("path")
bodyParser = require("body-parser")
Fixtures   = require("../helpers/fixtures")
e2e        = require("../helpers/e2e")

e2ePath = Fixtures.projectPath("e2e")

onServer = (app) ->
  app.use(bodyParser.json())

  app.get "/", (req, res) ->
    res.send("<html>outer content<iframe src='/iframe'></html>")

  app.get "/500", (req, res) ->
    res.send("<html>outer content<iframe src='/iframe_500'></html>")

  app.get "/iframe", (req, res) ->
    ## send the iframe contents
    res.sendFile(path.join(e2ePath, "static", "iframe", "index.html"))

  app.get "/iframe_500", (req, res) ->
    res.status(500).sendFile(path.join(e2ePath, "static", "iframe", "index.html"))

describe "e2e iframes", ->
  e2e.setup({
    servers: {
      port: 1616
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.start(@, {
      spec: "iframe_spec.coffee"
      expectedExitCode: 0
      debug: true
    })
