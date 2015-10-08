root          = "../../../"
winston       = require "winston"
sinon         = require("sinon")
sinonPromise  = require("sinon-as-promised")
fs            = require "fs-extra"
Promise       = require "bluebird"
_             = require "lodash"
path          = require "path"
expect        = require("chai").expect
config        = require "#{root}lib/config"
Log           = require "#{root}lib/log"
Exception     = require "#{root}lib/exception"

fs = Promise.promisifyAll(fs)

describe "Winston Logger", ->
  beforeEach ->
    @sandbox = sinon.sandbox.create()
    Log.clearLogs()

  afterEach ->
    Log.removeAllListeners("logging")
    @sandbox.restore()

  after ->
    fs.removeAsync(config.app.log_path)

  it "has 1 transport", ->
    expect(Log.transports).to.have.keys("all")

  it "logs to all", (done) ->
    Log.on "logging", (transport, level, msg, data) ->
      expect(level).to.eq("info")
      expect(msg).to.eq("foo!")
      expect(data).to.deep.eq({foo: "bar", type: "server"})
      done()

    Log.info("foo!", {foo: "bar"})

  describe "#onLog", ->
    it "calls back with log", (done) ->
      Log.onLog (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        done()

      Log.info("foo", {foo: "bar"})

    it "slices type out of data", (done) ->
      Log.onLog (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        expect(log.type).to.eq("native")
        done()

      Log.info("foo", {foo: "bar", type: "native"})

  describe "#getLogs", ->
    beforeEach (done) ->
      Log.onLog (log) ->
        done()

      Log.info("foo", {foo: "bar"})

    it "resolves with logs", ->
      Log.getLogs("all").then (logs) ->
        expect(logs).to.have.length(1)

  describe "#getData", ->
    it "nests data object in each log", ->
      obj = {level: "info", message: "foo", type: "native", foo: "bar"}

      expect(Log.getData(obj)).to.deep.eq {
        level: "info"
        message: "foo"
        type: "native"
        data: {
          foo: "bar"
        }
      }

  describe "#exitOnError", ->
    it "invokes logger.defaultErrorHandler", ->
      err = new Error
      defaultErrorHandler = @sandbox.stub(Log, "defaultErrorHandler")
      Log.exitOnError(err)
      expect(defaultErrorHandler).to.be.calledWith err

  describe "#defaultErrorHandler", ->
    beforeEach ->
      Log.unsetSettings()

      @err    = new Error
      @exit   = @sandbox.stub(process, "exit")
      @create = @sandbox.stub(Exception, "create").resolves()

    afterEach ->
      Log.unsetSettings()

    it "calls Exception.create(err)", ->
      Log.defaultErrorHandler(@err)
      expect(@create).to.be.calledWith(@err, undefined)

    it "calls Exception.create(err, {})", ->
      Log.setSettings({foo: "bar"})
      Log.defaultErrorHandler(@err)
      expect(@create).to.be.calledWith(@err, {foo: "bar"})

    it "returns false", ->
      expect(Log.defaultErrorHandler(@err)).to.be.false

    context "handleErr", ->
      it "is called after resolving", ->
        Log.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

      it "is called after rejecting", ->
        @create.rejects()
        Log.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

      it "calls process.exit(1)", ->
        Log.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.calledWith(1)

      it "calls Log#errorhandler", ->
        fn = @sandbox.spy()
        Log.setErrorHandler(fn)
        Log.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(fn).to.be.called

      it "calls exit if Log#errorhandler returns true", ->
        Log.setErrorHandler -> true
        Log.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

  describe "unhandledRejection", ->
    it "passes error to defaultErrorHandler", ->
      defaultErrorHandler = @sandbox.stub(Log, "defaultErrorHandler")

      handlers = process.listeners("unhandledRejection")

      expect(handlers.length).to.eq(1)

      err = new Error("foo")

      handlers[0](err)

    it "catches unhandled rejections", (done) ->
      defaultErrorHandler = @sandbox.stub(Log, "defaultErrorHandler")

      Promise
        .resolve("")
        .throw("foo")

      Promise.delay(50).then ->
        expect(defaultErrorHandler).to.be.calledOnce
        expect(defaultErrorHandler.getCall(0).args[0].message).to.eq("foo")
        done()

      # expect(defaultErrorHandler).to.be.calledWith(err)
  # it "logs to error", (done) ->
  #   # debugger
  #   process.listeners("uncaughtException").pop()
  #   err = (new Error)

  #   Log.on "logging", (transport, level, msg, data) ->
  #     debugger
  #     if transport.name is "error"
  #       expect(level).to.eq("error")
  #       expect(msg).to.eq("err")
  #       expect(data).to.eq(err)
  #       done()

  #   process.on "uncaughtException", (err) ->
  #     debugger

  #   throw err