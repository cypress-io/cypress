require("../spec_helper")

ws          = require("ws")
Promise     = require("bluebird")
socketIo    = require("@cypress/core-socket")
httpsServer = require("@cypress/core-https-proxy/test/helpers/https_server")
config      = require("#{root}lib/config")
Server      = require("#{root}lib/server")
Fixtures    = require("#{root}/spec/server/helpers/fixtures")

cyPort  = 12345
wsPort  = 20000
wssPort = 8443

describe "Web Sockets", ->
  beforeEach ->
    Fixtures.scaffold()

    @idsPath = Fixtures.projectPath("ids")

    config.get(@idsPath, {port: cyPort})
    .then (@cfg) =>
      @ws = new ws.Server({port: wsPort})

      @server = Server()
      @server.open(@cfg)

      .then =>
        httpsServer.start(wssPort)
      .then (httpsSrv) =>
        @wss = new ws.Server({server: httpsSrv})

  afterEach ->
    Fixtures.remove()

    @ws.close()
    @wss.close()

    Promise.join(
      @server.close(),
      httpsServer.stop()
    )

  context "proxying external websocket requests", ->
    it "correctly proxies when remoteHost is set", (done) ->
      @server._onDomainSet("http://localhost:#{wsPort}")

      @ws.on "connection", (c) ->
        c.on "message", (msg) ->
          c.send "response:#{msg}"

      client = new ws("ws://localhost:#{cyPort}", {
        headers: {
          Cookie: "__cypress.remoteHost=http://localhost:#{wsPort}"
        }
      })

      client.on "message", (data) ->
        expect(data).to.eq("response:foo")
        done()

      client.on "open", ->
        client.send("foo")

    it "ends the socket connection without remoteHost", (done) ->
      @server._onDomainSet()

      client = new ws("ws://localhost:#{cyPort}")

      client.on "error", (err) ->
        expect(err.code).to.eq("ECONNRESET")
        done()

    it "proxies https messages", (done) ->
      @server._onDomainSet("https://localhost:#{wssPort}")

      @wss.on "connection", (c) ->
        c.on "message", (msg) ->
          c.send "response:#{msg}"

      client = new ws("ws://localhost:#{cyPort}")

      client.on "message", (data) ->
        expect(data).to.eq("response:foo")
        done()

      client.on "open", ->
        client.send("foo")

  context "socket.io handling", ->
    beforeEach ->
      @server.startWebsockets({}, @cfg, {})

    context "http", ->
      beforeEach (done) ->
        @wsClient = socketIo.client(@cfg.clientUrlDisplay, {path: @cfg.socketIoRoute})
        @wsClient.on "connect", -> done()

      afterEach ->
        @wsClient.disconnect()

      it "continues to handle socket.io requests just fine", (done) ->
        @wsClient.emit "fixture", "example.json", (data) ->
          expect(data).to.deep.eq({foo: "bar"})
          done()

    # context.only "https", ->
    #   beforeEach (done) ->
    #     @server._onDomainSet("https://localhost:#{wssPort}")

    #     process.env.HTTP_PROXY = "http://localhost:#{cyPort}"
    #     process.env.http_proxy = "http://localhost:#{cyPort}"

    #     @wsClient = socketIo.client("https://localhost:#{wssPort}", {
    #       path: @cfg.socketIoRoute
    #     })

    #     @wsClient.on "connect", -> done()

    #   afterEach ->
    #     @wsClient.disconnect()

    #   it "continues to handle socket.io requests just fine", (done) ->
    #     @wsClient.emit "fixture", "example.json", (data) ->
    #       expect(data).to.deep.eq({foo: "bar"})
    #       done()

