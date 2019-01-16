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
fileServer    = require("#{root}lib/file_server")
connect       = require("#{root}lib/util/connect")
buffers       = require("#{root}lib/util/buffers")

morganFn = ->
mockery.registerMock("morgan", -> morganFn)

describe "lib/server", ->
  beforeEach ->
    @fileServer = {
      close: ->
      port: -> 1111
    }
    sinon.stub(fileServer, "create").returns(@fileServer)

    config.set({projectRoot: "/foo/bar/"})
    .then (cfg) =>
      @config = cfg
      @server = Server()

      @server._fileServer = @fileServer

  afterEach ->
    @server and @server.close()

  context "#createExpressApp", ->
    beforeEach ->
      @use = sinon.spy(express.application, "use")

    it "instantiates express instance without morgan", ->
      app = @server.createExpressApp(false)
      expect(app.get("view engine")).to.eq("html")
      expect(@use).not.to.be.calledWith(morganFn)

    it "requires morgan if true", ->
      @server.createExpressApp(true)
      expect(@use).to.be.calledWith(morganFn)

  context "#open", ->
    beforeEach ->
      sinon.stub(@server, "createServer").resolves()

    it "calls #createExpressApp with morgan", ->
      sinon.spy(@server, "createExpressApp")

      _.extend @config, {port: 54321, morgan: false}

      @server.open(@config)
      .then =>
        expect(@server.createExpressApp).to.be.calledWith(false)

    it "calls #createServer with port", ->
      _.extend @config, {port: 54321}

      obj = {}

      sinon.stub(@server, "createRoutes")
      sinon.stub(@server, "createExpressApp").returns(obj)

      @server.open(@config)
      .then =>
        expect(@server.createServer).to.be.calledWith(obj, @config)

    it "calls #createRoutes with app + config", ->
      obj = {}

      sinon.stub(@server, "createRoutes")
      sinon.stub(@server, "createExpressApp").returns(obj)

      @server.open(@config)
      .then =>
        expect(@server.createRoutes).to.be.calledWith(obj)

    it "calls #createServer with port + fileServerFolder + socketIoRoute + app", ->
      obj = {}

      sinon.stub(@server, "createRoutes")
      sinon.stub(@server, "createExpressApp").returns(obj)

      @server.open(@config)
      .then =>
        expect(@server.createServer).to.be.calledWith(obj, @config)

    it "calls logger.setSettings with config", ->
      sinon.spy(logger, "setSettings")

      @server.open(@config)
      .then (ret) =>
        expect(logger.setSettings).to.be.calledWith(@config)

  context "#createServer", ->
    beforeEach ->
      @port = 54321
      @app  = @server.createExpressApp(true)

    it "isListening=true", ->
      @server.createServer(@app, {port: @port})
      .then =>
        expect(@server.isListening).to.be.true

    it "resolves with http server port", ->
      @server.createServer(@app, {port: @port})
      .spread (port) =>
        expect(port).to.eq(@port)

    it "resolves with warning if cannot connect to baseUrl", ->
      sinon.stub(connect, "ensureUrl").rejects()
      @server.createServer(@app, {port: @port, baseUrl: "http://localhost:#{@port}"})
      .spread (port, warning) =>
        expect(warning.type).to.eq("CANNOT_CONNECT_BASE_URL_WARNING")
        expect(warning.message).to.include(@port)

    context "errors", ->
      it "rejects with portInUse", ->
        @server.createServer(@app, {port: @port})
        .then =>
          @server.createServer(@app, {port: @port})
        .then ->
          throw new Error("should have failed but didn't")
        .catch (err) =>
          expect(err.type).to.eq("PORT_IN_USE_SHORT")
          expect(err.message).to.include(@port)

  context "#end", ->
    it "calls this._socket.end", ->
      socket = sinon.stub({
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
      @startListening = sinon.stub(Socket.prototype, "startListening")

    it "sets _socket and calls _socket#startListening", ->
      @server.open(@config)
      .then =>
        @server.startWebsockets(1, 2, 3)

        expect(@startListening).to.be.calledWith(@server.getHttpServer(), 1, 2, 3)

  context "#reset", ->
    beforeEach ->
      sinon.stub(buffers, "reset")

    it "resets the buffers", ->
      @server.reset()
      expect(buffers.reset).to.be.called

    it "sets the domain to the previous base url if set", ->
      @server._baseUrl = "http://localhost:3000"
      @server.reset()
      expect(@server._remoteStrategy).to.equal("http")

    it "sets the domain to <root> if not set", ->
      @server.reset()
      expect(@server._remoteStrategy).to.equal("file")

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
      @server._socket = {close: sinon.spy()}

      @server.close()
      .then =>
        expect(@server._socket.close).to.be.calledOnce

  context "#proxyWebsockets", ->
    beforeEach ->
      @proxy  = sinon.stub({
        ws: ->
        on: ->
      })
      @socket = sinon.stub({end: ->})
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
        headers: {
          host: "www.google.com"
        }
      }

      @server.proxyWebsockets(@proxy, "/foo", req, @socket, @head)

      expect(@proxy.ws).to.be.calledWith(req, @socket, @head, {
        secure: false
        target: {
          host: "www.google.com"
          port: "443"
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

      expect(ret).to.deep.eq({
        auth: undefined
        origin: "https://staging.google.com"
        strategy: "http"
        domainName: "google.com"
        visiting: undefined
        fileServer: null
        props: {
          port: "443"
          domain: "google"
          tld: "com"
        }
      })

    it "sets port to 80 when omitted and http:", ->
      ret = @server._onDomainSet("http://staging.google.com/foo/bar")

      expect(ret).to.deep.eq({
        auth: undefined
        origin: "http://staging.google.com"
        strategy: "http"
        domainName: "google.com"
        visiting: undefined
        fileServer: null
        props: {
          port: "80"
          domain: "google"
          tld: "com"
        }
      })

    it "sets host + port to localhost", ->
      ret = @server._onDomainSet("http://localhost:4200/a/b?q=1#asdf")

      expect(ret).to.deep.eq({
        auth: undefined
        origin: "http://localhost:4200"
        strategy: "http"
        domainName: "localhost"
        visiting: undefined
        fileServer: null
        props: {
          port: "4200"
          domain: ""
          tld: "localhost"
        }
      })

    it "sets <root> when not http url", ->
      @server._server = {
        address: -> {port: 9999}
      }

      @server._fileServer = {
        port: -> 9998
      }

      ret = @server._onDomainSet("/index.html")

      expect(ret).to.deep.eq({
        auth: undefined
        origin: "http://localhost:9999"
        strategy: "file"
        domainName: "localhost"
        fileServer: "http://localhost:9998"
        props: null
        visiting: undefined
      })
