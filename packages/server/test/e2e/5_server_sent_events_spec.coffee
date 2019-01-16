SseStream = require("ssestream")
e2e = require("../support/helpers/e2e")

clients = 0

onServer = (app, srv) ->
  app.get "/clients", (req, res) ->
    res.json({ clients })

  app.get "/foo", (req, res) ->
    res.send("<html>foo></html>")

  app.get "/sse", (req, res) ->
    req.socket.destroy()

onSSEServer = (app) ->
  app.get "/sse", (req, res) ->
    clients += 1

    res.on "close", ->
      clearInterval(int)
      clients -= 1

    res.set({
      "Access-Control-Allow-Origin": "*"
    })

    @sseStream = new SseStream(req)
    @sseStream.pipe(res)

    i = 0

    int = setInterval =>
      i += 1

      @sseStream.write({
        data: "" + i
      })
    , 100

onSSEsServer = (app) ->

describe "e2e server sent events", ->
  e2e.setup({
    servers: [{
      port: 3038
      static: true
      onServer: onServer
    }, {
      port: 3039
      onServer: onSSEServer
    }, {
      port: 3040
      onServer: onSSEsServer
    }]
  })

  ## https://github.com/cypress-io/cypress/issues/1440
  it "passes", ->
    e2e.exec(@, {
      spec: "server_sent_events_spec.coffee"
      snapshot: true
      expectedExitCode: 0
    })
