e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/app/html", (req, res) ->
    res.send("<html>Herman Melville</html>")

describe "e2e baseUrl", ->
  context "https", ->
    e2e.setup({
      settings: {
        baseUrl: "https://httpbin.org"
      }
    })

    it "passes", ->
      e2e.start(@, {
        spec: "base_url_spec.coffee"
        expectedExitCode: 0
      })

  context "http", ->
    e2e.setup({
      servers: {
        port: 9999
        onServer: onServer
      }
      settings: {
        baseUrl: "http://localhost:9999/app"
      }
    })

    it "passes", ->
      e2e.start(@, {
        spec: "base_url_spec.coffee"
        expectedExitCode: 0
      })
