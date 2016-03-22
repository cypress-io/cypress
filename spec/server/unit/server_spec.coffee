require("../spec_helper")

_             = require("lodash")
http          = require("http")
express       = require("express")
routes        = require("#{root}lib/routes")
config        = require("#{root}lib/config")
logger        = require("#{root}lib/logger")
Server        = require("#{root}lib/server")
Socket        = require("#{root}lib/socket")

morganFn = ->
mockery.registerMock("morgan", -> morganFn)

describe "lib/server", ->
  beforeEach ->
    @config = config.mergeDefaults()
    @server = Server()

  afterEach ->
    @server and @server.close()

  context "#createExpressApp", ->
    beforeEach ->
      @use = @sandbox.spy(express.application, "use")

    it "instantiates express instance without morgan", ->
      app = @server.createExpressApp(1234, false)
      expect(app.get("port")).to.eq(1234)
      expect(app.get("view engine")).to.eq("html")
      expect(@use).not.to.be.calledWith(morganFn)

    it "requires morgan if true", ->
      @server.createExpressApp(1234, true)
      expect(@use).to.be.calledWith(morganFn)

  context "#open", ->
    beforeEach ->
      @sandbox.stub(@server, "createServer").resolves()

    it "resolves with server instance", ->
      @server.open("/", @config)
      .then (ret) =>
        expect(ret).to.eq(@server)

    it "calls #createExpressApp with port + morgan", ->
      @sandbox.spy(@server, "createExpressApp")

      _.extend @config, {port: 1234, morgan: false}

      @server.open("/", @config)
      .then =>
        expect(@server.createExpressApp).to.be.calledWith(1234, false)

    it "calls #createRoutes with app + config", ->
      obj = {}

      @sandbox.stub(@server, "createRoutes")
      @sandbox.stub(@server, "createExpressApp").returns(obj)

      @server.open("/", @config)
      .then =>
        expect(@server.createRoutes).to.be.calledWith(obj)

    it "calls #createServer with port + app", ->
      obj = {}

      @sandbox.stub(@server, "createRoutes")
      @sandbox.stub(@server, "createExpressApp").returns(obj)

      @server.open("/", @config)
      .then =>
        expect(@server.createServer).to.be.calledWith(@config.port, obj)

    it "calls logger.setSettings with config", ->
      @sandbox.spy(logger, "setSettings")

      @server.open("/", @config)
      .then (ret) =>
        expect(logger.setSettings).to.be.calledWith(@config)

  context "#createServer", ->
    beforeEach ->
      @port = 1234
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
      @server.open("/", @config)
      .then =>
        @server.startWebsockets(1, 2, 3)

        expect(@startListening).to.be.calledWith(@server.getHttpServer(), 1, 2, 3)

  context "#close", ->
    it "returns a promise", ->
      expect(@server.close()).to.be.instanceof Promise

    it "calls close on this.server", ->
      @server.open("/", @config)
      .then =>
        @server.close()

    it "isListening=false", ->
      @server.open("/", @config)
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

