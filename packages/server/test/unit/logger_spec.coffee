require("../spec_helper")

_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
appData       = require("#{root}lib/util/app_data")
konfig        = require("#{root}lib/konfig")
logger        = require("#{root}lib/logger")
exception     = require("#{root}lib/exception")

describe "lib/logger", ->
  beforeEach ->
    logger.clearLogs()

  afterEach ->
    logger.removeAllListeners("logging")

  after ->
    appData.remove()

  it "has 1 transport", ->
    expect(logger.transports).to.include.keys("all")

  it "logs to all", (done) ->
    done = _.once(done)

    logger.on "logging", (transport, level, msg, data) ->
      expect(level).to.eq("info")
      expect(msg).to.eq("foo!")
      expect(data).to.deep.eq({foo: "bar", type: "server"})
      done()

    logger.info("foo!", {foo: "bar"})

  describe "#onLog", ->
    it "calls back with log", (done) ->
      logger.onLog (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        done()

      logger.info("foo", {foo: "bar"})

    it "slices type out of data", (done) ->
      logger.onLog (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        expect(log.type).to.eq("native")
        done()

      logger.info("foo", {foo: "bar", type: "native"})

  describe "#getLogs", ->
    beforeEach (done) ->
      logger.onLog (log) ->
        done()

      logger.info("foo", {foo: "bar"})

    it "resolves with logs", ->
      logger.getLogs("all").then (logs) ->
        expect(logs).to.have.length(1)

  describe "#getData", ->
    it "nests data object in each log", ->
      obj = {level: "info", message: "foo", type: "native", foo: "bar"}

      expect(logger.getData(obj)).to.deep.eq {
        level: "info"
        message: "foo"
        type: "native"
        data: {
          foo: "bar"
        }
      }

  describe "#exitOnError", ->
    it "invokes logger.defaultErrorHandler", ->
      err = new Error()
      defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler")
      logger.exitOnError(err)
      expect(defaultErrorHandler).to.be.calledWith err

  describe "#defaultErrorHandler", ->
    beforeEach ->
      logger.unsetSettings()

      @err    = new Error()
      @exit   = sinon.stub(process, "exit")
      @create = sinon.stub(exception, "create").resolves()

    afterEach ->
      logger.unsetSettings()

    it "calls exception.create(err)", ->
      logger.defaultErrorHandler(@err)
      expect(@create).to.be.calledWith(@err, undefined)

    it "calls exception.create(err, {})", ->
      logger.setSettings({foo: "bar"})
      logger.defaultErrorHandler(@err)
      expect(@create).to.be.calledWith(@err, {foo: "bar"})

    it "returns false", ->
      expect(logger.defaultErrorHandler(@err)).to.be.false

    context "handleErr", ->
      it "is called after resolving", ->
        logger.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

      it "is called after rejecting", ->
        @create.rejects(new Error())
        logger.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

      it "calls process.exit(1)", ->
        logger.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.calledWith(1)

      it "calls Log#errorhandler", ->
        fn = sinon.spy()
        logger.setErrorHandler(fn)
        logger.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(fn).to.be.called

      it "calls exit if Log#errorhandler returns true", ->
        logger.setErrorHandler -> true
        logger.defaultErrorHandler(@err)
        Promise.delay(50).then =>
          expect(@exit).to.be.called

  describe "unhandledRejection", ->
    it "passes error to defaultErrorHandler", ->
      defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler")

      handlers = process.listeners("unhandledRejection")

      expect(handlers.length).to.eq(1)

      err = new Error("foo")

      handlers[0](err)

    it "catches unhandled rejections", ->
      defaultErrorHandler = sinon.stub(logger, "defaultErrorHandler")

      Promise
        .resolve("")
        .throw(new Error("foo"))

      Promise.delay(50).then ->
        expect(defaultErrorHandler).to.be.calledOnce
        expect(defaultErrorHandler.getCall(0).args[0].message).to.eq("foo")

      # expect(defaultErrorHandler).to.be.calledWith(err)
  # it "logs to error", (done) ->
  #   # debugger
  #   process.listeners("uncaughtException").pop()
  #   err = (new Error)

  #   logger.on "logging", (transport, level, msg, data) ->
  #     debugger
  #     if transport.name is "error"
  #       expect(level).to.eq("error")
  #       expect(msg).to.eq("err")
  #       expect(data).to.eq(err)
  #       done()

  #   process.on "uncaughtException", (err) ->
  #     debugger

  #   throw err
