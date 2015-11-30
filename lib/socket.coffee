fs            = require "fs-extra"
path          = require 'path'
uuid          = require 'node-uuid'
sauce         = require './sauce/sauce'
Promise       = require "bluebird"
IdGenerator   = require './id_generator'
Fixtures      = require "./fixtures"
Request       = require "./request"
Log           = require "./log"
SecretSauce   = require "../lib/util/secret_sauce_loader"

class Socket
  fs: fs
  Log: Log
  Request: Request
  Fixtures: Fixtures
  Promise: Promise
  path: path
  uuid: uuid
  sauce: sauce

  constructor: (io, app) ->
    if not (@ instanceof Socket)
      return new Socket(io, app)

    if not app
      throw new Error("Instantiating lib/socket requires an app!")

    if not io
      throw new Error("Instantiating lib/socket requires an io instance!")

    @app         = app
    @io          = io
    @idGenerator = IdGenerator(@app)

  startListening: (watchers, options) ->
    if process.env["CYPRESS_ENV"] is "development"
      @listenToCssChanges(watchers)

    @_startListening(path, watchers, options)

  listenToCssChanges: (watchers) ->
    watchers.watch path.join(process.cwd(), "lib", "public", "css"), {
      ignored: (path, stats) =>
        return false if fs.statSync(path).isDirectory()

        not /\.css$/.test path
      onChange: (filePath, stats) =>
        filePath = path.basename(filePath)
        @io.emit "cypress:css:changed", file: filePath
    }

  close: ->
    @io.close()

SecretSauce.mixin("Socket", Socket)

module.exports = Socket