require("../spec_helper")

_             = require("lodash")
http          = require("http")
express       = require("express")
Promise       = require("bluebird")
routes        = require("#{root}lib/routes")
config        = require("#{root}lib/config")
logger        = require("#{root}lib/logger")
Server        = require("#{root}lib/server")
Socket        = require("#{root}lib/socket")

morganFn = ->
mockery.registerMock("morgan", -> morganFn)

describe "lib/server", ->
  beforeEach ->
    @config = config.set({})
    @server = Server()

  afterEach ->
    @server and @server.close()

  context "#createExpressApp", ->
    beforeEach ->
      @use = @sandbox.spy(express.application, "use")

    it "instantiates express instance without morgan", ->
      app = @server.createExpressApp(54321, false)
      expect(app.get("port")).to.eq(54321)
      expect(app.get("view engine")).to.eq("html")
      expect(@use).not.to.be.calledWith(morganFn)

    it "requires morgan if true", ->
      @server.createExpressApp(54321, true)
      expect(@use).to.be.calledWith(morganFn)

  context "#open", ->
    beforeEach ->
      @sandbox.stub(@server, "createServer").resolves()

    it "resolves with server instance", ->
      @server.open(@config)
      .then (ret) =>
        expect(ret).to.eq(@server)

    it "calls #createExpressApp with port + morgan", ->
      @sandbox.spy(@server, "createExpressApp")

      _.extend @config, {port: 54321, morgan: false}

      @server.open(@config)
      .then =>
        expect(@server.createExpressApp).to.be.calledWith(54321, false)

    it "calls #createRoutes with app + config", ->
      obj = {}

      @sandbox.stub(@server, "createRoutes")
      @sandbox.stub(@server, "createExpressApp").returns(obj)

      @server.open(@config)
      .then =>
        expect(@server.createRoutes).to.be.calledWith(obj)

    it "calls #createServer with port + app", ->
      obj = {}

      @sandbox.stub(@server, "createRoutes")
      @sandbox.stub(@server, "createExpressApp").returns(obj)

      @server.open(@config)
      .then =>
        expect(@server.createServer).to.be.calledWith(@config.port, @config.socketIoRoute, obj)

    it "calls logger.setSettings with config", ->
      @sandbox.spy(logger, "setSettings")

      @server.open(@config)
      .then (ret) =>
        expect(logger.setSettings).to.be.calledWith(@config)

  context "#createServer", ->
    beforeEach ->
      @port = 54321
      @app  = @server.createExpressApp(@port, true)

    it "isListening=true", ->
      @server.createServer(@port, @app)
      .then =>
        expect(@server.isListening).to.be.true

    it "resolves with http server instance", ->
      @server.createServer(@port, @app)
      .then (ret) =>
        expect(ret).to.be.instanceof(http.Server)

    context "errors", ->
      it "rejects with portInUse", ->
        @server.createServer(@port, @app)
        .then =>
          @server.createServer(@port, @app)
        .then ->
          throw new Error("should have failed but didn't")
        .catch (err) =>
          expect(err.type).to.eq("PORT_IN_USE_SHORT")
          expect(err.message).to.include(@port)

  context "#end", ->
    it "calls this._socket.end", ->
      socket = @sandbox.stub({
        end: ->
        close: ->
      })

      @server._socket = socket

      @server.end()
      expect(socket.end).to.be.called

    it "is noop without this._socket", ->
      @server.end()

  context "#startWebsockets", ->
    beforeEach ->
      @startListening = @sandbox.stub(Socket.prototype, "startListening")

    it "sets _socket and calls _socket#startListening", ->
      @server.open(@config)
      .then =>
        @server.startWebsockets(1, 2, 3)

        expect(@startListening).to.be.calledWith(@server.getHttpServer(), 1, 2, 3)

  context "#close", ->
    it "returns a promise", ->
      expect(@server.close()).to.be.instanceof Promise

    it "calls close on this.server", ->
      @server.open(@config)
      .then =>
        @server.close()

    it "isListening=false", ->
      @server.open(@config)
      .then =>
        @server.close()
      .then =>
        expect(@server.isListening).to.be.false

    it "clears settings from Log", ->
      logger.setSettings({})

      @server.close()
      .then ->
        expect(logger.getSettings()).to.be.undefined

    it "calls close on this._socket", ->
      @server._socket = {close: @sandbox.spy()}

      @server.close()
      .then =>
        expect(@server._socket.close).to.be.calledOnce

  context "#proxyWebsockets", ->
    beforeEach ->
      @proxy  = @sandbox.stub({ws: ->})
      @socket = @sandbox.stub({end: ->})
      @head   = {}

    it "is noop if req.url startsWith socketIoRoute", ->
      noop = @server.proxyWebsockets(@proxy, "/foo", {
        url: "/foobarbaz"
      })

      expect(noop).to.be.undefined

    it "calls proxy.ws with hostname + port", ->
      @server._onDomainSet("https://www.google.com")

      req = {
        url: "/"
      }

      @server.proxyWebsockets(@proxy, "/foo", req, @socket, @head)

      expect(@proxy.ws).to.be.calledWith(req, @socket, @head, {
        secure: false
        target: {
          host: "www.google.com"
          port: null
          protocol: "https:"
        }
      })

    it "ends the socket if its writable and there is no __cypress.remoteHost", ->
      req = {
        url: "/"
        headers: {
          cookie: "foo=bar"
        }
      }

      @server.proxyWebsockets(@proxy, "/foo", req, @socket, @head)
      expect(@socket.end).not.to.be.called

      @socket.writable = true
      @server.proxyWebsockets(@proxy, "/foo", req, @socket, @head)
      expect(@socket.end).to.be.called

  context "#_onDomainSet", ->
    beforeEach ->
      @server = Server()

    it "sets port to 443 when omitted and https:", ->
      ret = @server._onDomainSet("https://staging.google.com/foo/bar")

      expect(@server._remoteOrigin).to.eq("https://staging.google.com")
      expect(@server._remoteProps).to.deep.eq({
        port: "443"
        domain: "google"
        tld: "com"
      })

      expect(ret).to.eq(@server._remoteOrigin)

    it "sets port to 80 when omitted and http:", ->
      ret = @server._onDomainSet("http://staging.google.com/foo/bar")

      expect(@server._remoteOrigin).to.eq("http://staging.google.com")
      expect(@server._remoteProps).to.deep.eq({
        port: "80"
        domain: "google"
        tld: "com"
      })

      expect(ret).to.eq(@server._remoteOrigin)

    it "sets host + port to localhost", ->
      ret = @server._onDomainSet("http://localhost:4200/a/b?q=1#asdf")

      expect(@server._remoteOrigin).to.eq("http://localhost:4200")
      expect(@server._remoteProps).to.deep.eq({
        port: "4200"
        domain: ""
        tld: "localhost"
      })

      expect(ret).to.eq(@server._remoteOrigin)

    it "sets <root> when not http url", ->
      @server._server = {
        address: -> {port: 9999}
      }

      ret = @server._onDomainSet("/index.html")

      expect(@server._remoteOrigin).to.eq("<root>")
      expect(@server._remoteProps).to.be.null

      expect(ret).to.eq("http://localhost:9999")

  context "#_onDirectConnection", ->
    beforeEach ->
      @server = Server()

    describe "domain + subdomain", ->
      beforeEach ->
        @server._remoteProps = @server._parseUrl("staging.google.com:443")

      it "does not match", ->
        expect(@server._urlMatchesOriginPolicy("foo.bar:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("foo.bar:80")).to.be.false
        expect(@server._urlMatchesOriginPolicy("staging.google.com:80")).to.be.false
        expect(@server._urlMatchesOriginPolicy("staging.google2.com:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("staging.google.net:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("google.net:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("google.com:80")).to.be.false

      it "matches", ->
        expect(@server._urlMatchesOriginPolicy("staging.google.com:443")).to.be.true
        expect(@server._urlMatchesOriginPolicy("google.com:443")).to.be.true
        expect(@server._urlMatchesOriginPolicy("foo.google.com:443")).to.be.true
        expect(@server._urlMatchesOriginPolicy("foo.bar.google.com:443")).to.be.true

    describe "localhost", ->
      beforeEach ->
        @server._remoteProps = @server._parseUrl("localhost:4200")

      it "does not match", ->
        expect(@server._urlMatchesOriginPolicy("localhost:4201")).to.be.false
        expect(@server._urlMatchesOriginPolicy("localhoss:4200")).to.be.false

      it "matches", ->
        expect(@server._urlMatchesOriginPolicy("localhost:4200")).to.be.true

    describe "local", ->
      beforeEach ->
        @server._remoteProps = @server._parseUrl("brian.dev.local:80")

      it "does not match", ->
        expect(@server._urlMatchesOriginPolicy("brian.dev.local:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("brian.dev2.local:80")).to.be.false

      it "matches", ->
        expect(@server._urlMatchesOriginPolicy("jennifer.dev.local:80")).to.be.true

    describe "ip address", ->
      beforeEach ->
        @server._remoteProps = @server._parseUrl("192.168.5.10:80")

      it "does not match", ->
        expect(@server._urlMatchesOriginPolicy("192.168.5.10:443")).to.be.false
        expect(@server._urlMatchesOriginPolicy("193.168.5.10:80")).to.be.false

      it "matches", ->
        expect(@server._urlMatchesOriginPolicy("192.168.5.10:80")).to.be.true
