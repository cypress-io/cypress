require("../spec_helper")

ws        = require("ws")
socketIo  = require("@cypress/core-socket")
config    = require("#{root}lib/config")
Server    = require("#{root}lib/server")
Fixtures  = require("#{root}/spec/server/helpers/fixtures")

cyPort = 12345
wsPort   = 20000

describe "Web Sockets", ->
  beforeEach ->
    Fixtures.scaffold()

    @idsPath = Fixtures.projectPath("ids")

    config.get(@idsPath, {port: cyPort}).then (@cfg) =>

      @wss = new ws.Server({port: wsPort})

      @server = Server()
      @server.open(@idsPath, @cfg)

  afterEach ->
    Fixtures.remove()

    @wss.close()
    @server.close()

  context "proxying external websocket requests", ->
    it "correctly proxies when remoteHost is set", (done) ->
      @wss.on "connection", (c) ->
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
      client = new ws("ws://localhost:#{cyPort}")

      client.on "error", (err) ->
        expect(err.code).to.eq("ECONNRESET")
        done()

  context "socket.io handling", ->
    beforeEach (done) ->
      @server.startWebsockets({}, @cfg, {})

      @wsClient = socketIo.client(@cfg.clientUrlDisplay, {path: @cfg.socketIoRoute})
      @wsClient.on "connect", -> done()

    afterEach ->
      @wsClient.disconnect()

    it "continues to handle socket.io requests just fine", (done) ->
      @wsClient.emit "fixture", "example.json", (data) ->
        expect(data).to.deep.eq({foo: "bar"})
        done()
