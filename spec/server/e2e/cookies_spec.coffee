parser   = require("cookie-parser")
e2e      = require("../helpers/e2e")

onServer = (app) ->
  app.use(parser())

  app.get "/foo", (req, res) ->
    console.log "cookies", req.cookies
    res.send(req.cookies)

describe "e2e cookies", ->
  e2e.setup({
    servers: {
      port: 2121
      onServer: onServer
    }
  })

  it "passes", ->
    e2e.start(@, {
      spec: "cookies_spec.coffee"
      expectedExitCode: 0
    })
