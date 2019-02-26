require("../spec_helper")

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

ws          = require("ws")
httpsAgent  = require("https-proxy-agent")
evilDns     = require("evil-dns")
Promise     = require("bluebird")
socketIo    = require("#{root}../socket")
httpsServer = require("#{root}../https-proxy/test/helpers/https_server")
config      = require("#{root}lib/config")
Server      = require("#{root}lib/server")
Automation  = require("#{root}lib/automation")
Fixtures    = require("#{root}/test/support/helpers/fixtures")

cyPort  = 12345
otherPort = 5555
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

    evilDns.clear()

    @ws.close()
    @wss.close()

    Promise.join(
      @server.close(),
      httpsServer.stop()
    )

  context "proxying external websocket requests", ->
    it "ends the socket connection without remoteHost", (done) ->
      @server._onDomainSet()

      client = new ws("ws://localhost:#{cyPort}")

      client.on "error", (err) ->
        expect(err.code).to.eq("ECONNRESET")
        done()

    it "sends back 502 Bad Gateway when error upgrading", (done) ->
      agent = new httpsAgent("http://localhost:#{cyPort}")

      @server._onDomainSet("http://localhost:#{otherPort}")

      client = new ws("ws://localhost:#{otherPort}", {
        agent: agent
      })

      client.on "unexpected-response", (req, res) ->
        expect(res.statusCode).to.eq(502)
        expect(res.statusMessage).to.eq("Bad Gateway")
        expect(res.headers).to.have.property("x-cypress-proxy-error-message")
        expect(res.headers).to.have.property("x-cypress-proxy-error-code")

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

    it "proxies http messages through http proxy", (done) ->
      ## force node into legit proxy mode like a browser
      agent = new httpsAgent("http://localhost:#{cyPort}")

      @server._onDomainSet("http://localhost:#{wsPort}")

      @ws.on "connection", (c) ->
        c.on "message", (msg) ->
          c.send "response:#{msg}"

      client = new ws("ws://localhost:#{wsPort}", {
        agent: agent
      })

      client.on "message", (data) ->
        expect(data).to.eq("response:foo")
        done()

      client.on "open", ->
        client.send("foo")

    it "proxies https messages through http", (done) ->
      ## force node into legit proxy mode like a browser
      agent = new httpsAgent("http://localhost:#{cyPort}")

      @server._onDomainSet("https://localhost:#{wssPort}")

      @wss.on "connection", (c) ->
        c.on "message", (msg) ->
          c.send "response:#{msg}"

      client = new ws("wss://localhost:#{wssPort}", {
        agent: agent
      })

      client.on "message", (data) ->
        expect(data).to.eq("response:foo")
        done()

      client.on "open", ->
        client.send("foo")

    it "proxies through subdomain by using host header", (done) ->
      ## we specifically only allow remote connections
      ## to ws.foobar.com since that is where the websocket
      ## server is mounted and this tests that we make
      ## a connection to the right host instead of the
      ## origin (which isnt ws.foobar.com)
      nock.enableNetConnect("ws.foobar.com")

      evilDns.add("ws.foobar.com", "127.0.0.1")

      ## force node into legit proxy mode like a browser
      agent = new httpsAgent("http://localhost:#{cyPort}")

      @server._onDomainSet("https://foobar.com:#{wssPort}")

      @wss.on "connection", (c) ->
        c.on "message", (msg) ->
          c.send "response:#{msg}"

      client = new ws("wss://ws.foobar.com:#{wssPort}", {
        agent: agent
      })

      client.on "message", (data) ->
        expect(data).to.eq("response:foo")
        done()

      client.on "open", ->
        client.send("foo")

  context "socket.io handling", ->
    beforeEach ->
      @automation = Automation.create(@cfg.namespace, @cfg.socketIoCookie, @cfg.screenshotsFolder)

      @server.startWebsockets(@automation, @cfg, {})

    context "http", ->
      beforeEach (done) ->
        @wsClient = socketIo.client(@cfg.proxyUrl, {
          path: @cfg.socketIoRoute
          transports: ["websocket"]
        })
        @wsClient.on "connect", -> done()

      afterEach ->
        @wsClient.disconnect()

      it "continues to handle socket.io requests just fine", (done) ->
        @wsClient.emit "backend:request", "get:fixture", "example.json", {}, (data) ->
          expect(data.response).to.deep.eq({foo: "bar"})
          done()

    context "when http superDomain has been set", ->
      beforeEach (done) ->
        ## force node into legit proxy mode like a browser
        agent = new httpsAgent("http://localhost:#{cyPort}")

        @server._onDomainSet("http://localhost:#{otherPort}")

        @wsClient = socketIo.client("http://localhost:#{otherPort}", {
          agent: agent
          path: @cfg.socketIoRoute
          transports: ["websocket"]
        })
        @wsClient.on "connect", -> done()

      afterEach ->
        @wsClient.disconnect()

      it "continues to handle socket.io requests just fine", (done) ->
        @wsClient.emit "backend:request", "get:fixture", "example.json", {}, (data) ->
          expect(data.response).to.deep.eq({foo: "bar"})
          done()

    context "when https superDomain has been set", ->
      beforeEach (done) ->
        ## force node into legit proxy mode like a browser
        agent = new httpsAgent("http://localhost:#{cyPort}")

        @server._onDomainSet("https://localhost:#{wssPort}")

        ## must not use a direct websocket transport else we'll
        ## never make it to the /__socket.io route
        @wsClient = socketIo.client("https://localhost:#{wssPort}", {
          agent: agent
          path: @cfg.socketIoRoute
        })
        @wsClient.on "connect", -> done()

      afterEach ->
        @wsClient.disconnect()

      it "continues to handle socket.io requests just fine", (done) ->
        @wsClient.emit "backend:request", "get:fixture", "example.json", {}, (data) ->
          expect(data.response).to.deep.eq({foo: "bar"})
          done()
