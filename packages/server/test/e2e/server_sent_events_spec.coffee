SseStream = require("ssestream")
EventSource = require("eventsource")
e2e = require("../support/helpers/e2e")

onServer = (app) ->
  app.get "/foo", (req, res) ->
    res.send("<html>foo></html>")

  app.get "/sse", (req, res) ->
    req.socket.destroy()

onSSEServer = (app) ->
  app.get "/sse", (req, res) ->
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
      exit: false
      headed: true
      snapshot: true
      expectedExitCode: 0
    })
