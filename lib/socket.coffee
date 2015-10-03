fs            = require "fs-extra"
path          = require 'path'
uuid          = require 'node-uuid'
sauce         = require './sauce/sauce'
chokidar      = require 'chokidar'
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
  chokidar: chokidar
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

  startListening: (options) ->
    @app.once "close", @close.bind(@)

    if process.env["CYPRESS_ENV"] is "development"
      @listenToCssChanges()

    @_startListening(path, options)

  listenToCssChanges: ->
    watchCssFiles = chokidar.watch path.join(process.cwd(), "lib", "public", "css"), ignored: (path, stats) =>
      return false if fs.statSync(path).isDirectory()

      not /\.css$/.test path

    # watchCssFiles.on "add", (path) -> console.log "added css:", path
    watchCssFiles.on "change", (filePath, stats) =>
      filePath = path.basename(filePath)
      @io.emit "cypress:css:changed", file: filePath

  close: (watchedFiles) ->
    @io.close()

    @closeWatchers()

SecretSauce.mixin("Socket", Socket)

module.exports = Socket