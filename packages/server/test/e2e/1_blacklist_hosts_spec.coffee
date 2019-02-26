e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/", (req, res) ->
    res.send("<html>hi there</html>")

  app.get "/req", (req, res) ->
    res.sendStatus(200)

  app.get "/status", (req, res) ->
    res.sendStatus(503)

describe "e2e blacklist", ->
  e2e.setup({
    servers: [{
      port: 3131
      onServer
    }, {
      port: 3232
      onServer
    }]
    settings: {
      baseUrl: "http://localhost:3232"
      blacklistHosts: "localhost:3131"
    }
  })

  it "passes", ->
    e2e.exec(@, {
      spec: "blacklist_hosts_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
