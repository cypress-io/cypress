bodyParser = require("body-parser")
e2e        = require("../support/helpers/e2e")

onServer = (app) ->
  app.use(bodyParser.json())

  app.get "/", (req, res) ->
    res.send("<html>hi there</html>")

  app.post "/login", (req, res) ->
    ## respond with JSON with exactly what the
    ## request body was and all of the request headers
    res.json({
      body: req.body
      headers: req.headers
    })

  app.post "/html", (req, res) ->
    res.json({content: "<html>content</html>"})

describe "e2e xhr", ->
  e2e.setup({
    servers: {
      port: 1919
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "xhr_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
