root    = "../../../"
Log     = require "#{root}/lib/log"
winston = require "winston"
fs      = require "fs-extra"
Promise = require "bluebird"
_       = require "lodash"
path    = require "path"
expect  = require("chai").expect

fs = Promise.promisifyAll(fs)

describe "Winston Logger", ->
  afterEach ->
    files = _.map Log.transports, (value, key) ->
      fs.removeAsync path.join(value.dirname, value.filename)

    Promise.all(files)

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