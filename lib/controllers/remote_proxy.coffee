Domain       = require 'domain'
url          = require 'url'
mime         = require 'mime'
path         = require 'path'
_            = require 'lodash'
fs           = require 'fs'
harmon       = require "harmon"
through      = require 'through'
httpProxy    = require 'http-proxy'
# trumpet      = require "trumpet"
Log          = require "../log"
UrlHelpers   = require '../util/url_helpers'
escapeRegExp = require "../util/escape_regexp"
SecretSauce  = require "../util/secret_sauce_loader"

Controller  = require "./controller"

class RemoteProxy extends Controller
  fs: fs
  url: url
  mime: mime
  path: path
  Log: Log
  # trumpet: trumpet
  harmon: harmon
  through: through
  UrlHelpers: UrlHelpers
  escapeRegExp: escapeRegExp

  constructor: (app) ->
    if not (@ instanceof RemoteProxy)
      return new RemoteProxy(app)

    if not app
      throw new Error("Instantiating controllers/remote_proxy requires an app!")

    @app = app

    super

  handle: (req, res, next) ->
    @_handle(req, res, next, Domain, httpProxy)

SecretSauce.mixin("RemoteProxy", RemoteProxy)

module.exports = RemoteProxy