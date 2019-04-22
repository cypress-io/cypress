moment   = require("moment")
parser   = require("cookie-parser")
e2e      = require("../support/helpers/e2e")
humanInterval = require("human-interval")

count = 0

onServer = (app) ->
  app.get "/works-third-time", (req, res) ->
    id = req.params.id
    count += 1
    if count == 3
      return res.send('ok')
    req.socket.destroy()

describe "e2e network error handling", ->
  e2e.setup({
    servers: [
      {
        onServer
        port: 13370
      }
    ],
    settings: {
      baseUrl: "http://localhost:13370/"
    }
  })

  it "fails", ->
    e2e.exec(@, {
      spec: "network_error_handling_spec.js"
      snapshot: true
      expectedExitCode: 1
    })
