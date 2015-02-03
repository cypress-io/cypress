fs            = require 'fs'
_             = require 'underscore'
path          = require 'path'
uuid          = require 'node-uuid'
# sauce         = require '../sauce/sauce.coffee'
jQuery        = require 'jquery-deferred'
chokidar      = require 'chokidar'
IdGenerator   = require './id_generator.coffee'
SecretSauce   = require "../lib/util/secret_sauce_loader"

class Socket
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

  startListening: ->
    @_startListening(chokidar, path, fs)

SecretSauce.mixin("Socket", Socket)

module.exports = Socket