fs            = require "fs-extra"
path          = require 'path'
uuid          = require 'node-uuid'
sauce         = require './sauce/sauce'
chokidar      = require 'chokidar'
Promise       = require "bluebird"
IdGenerator   = require './id_generator'
Fixtures      = require "./fixtures"
Log           = require "./log"
SecretSauce   = require "../lib/util/secret_sauce_loader"

class Socket
  fs: fs
  Log: Log
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

    @_startListening(chokidar, path, options)

  close: (watchedFiles) ->
    @io.close()

    @closeWatchers()

SecretSauce.mixin("Socket", Socket)

module.exports = Socket