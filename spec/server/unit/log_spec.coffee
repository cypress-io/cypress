root    = "../../../"
config  = require("konfig")()
Log     = require "#{root}/lib/log"
winston = require "winston"
fs      = require "fs-extra"
Promise = require "bluebird"
_       = require "lodash"
path    = require "path"
expect  = require("chai").expect

fs = Promise.promisifyAll(fs)

describe "Winston Logger", ->
  beforeEach ->
    Log.forceLogger = true
    Log.clearLogs()

  afterEach ->
    Log.removeAllListeners("logging")

  after ->
    delete Log.forceLogger
    fs.removeAsync(config.app.log_path)

  it "has 4 transports", ->
    expect(Log.transports).to.have.keys("all", "info", "error", "profile")

  it "logs to all", (done) ->
    Log.on "logging", (transport, level, msg, data) ->
      if transport.name is "all"
        expect(level).to.eq("info")
        expect(msg).to.eq("foo!")
        expect(data).to.deep.eq({foo: "bar"})
        done()

    Log.info("foo!", {foo: "bar"})

  describe "#onLog", ->
    it "calls back with log", (done) ->
      Log.onLog "all", (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        done()

      Log.info("foo", {foo: "bar"})

    it "slices type out of data", (done) ->
      Log.onLog "all", (log) ->
        expect(log.level).to.eq("info")
        expect(log.message).to.eq("foo")
        expect(log.data).to.deep.eq({foo: "bar"})
        expect(log.type).to.eq("native")
        done()

      Log.info("foo", {foo: "bar", type: "native"})

  describe "#getLogs", ->
    beforeEach (done) ->
      Log.onLog "all", (log) ->
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