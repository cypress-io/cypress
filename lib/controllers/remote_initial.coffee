path          = require "path"
fs            = require 'fs'
request       = require 'request'
mime          = require 'mime'
path          = require 'path'
Domain        = require 'domain'
through       = require 'through'
through2      = require 'through2'
jsUri         = require "jsuri"
trumpet       = require "trumpet"
url           = require "url"
Log           = require "../log"
UrlHelpers    = require "../util/url_helpers"
escapeRegExp = require "../util/escape_regexp"
SecretSauce   = require "../util/secret_sauce_loader"

Controller  = require "./controller"

class RemoteInitial extends Controller
  escapeRegExp: escapeRegExp
  through: through
  through2: through2
  UrlHelpers: UrlHelpers
  request: request
  path: path
  fs: fs
  Log: Log
  jsUri: jsUri
  trumpet: trumpet
  mime: mime
  url: url

  constructor: (app) ->
    if not (@ instanceof RemoteInitial)
      return new RemoteInitial(app)

    if not app
      throw new Error("Instantiating controllers/remote_initial requires an app!")

    @app = app

    super

  handle: (req, res, next) ->
    @_handle(req, res, next, Domain)

SecretSauce.mixin("RemoteInitial", RemoteInitial)

module.exports = RemoteInitial