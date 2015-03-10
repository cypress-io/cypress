_             = require 'lodash'
Promise       = require 'bluebird'
path          = require 'path'
Request       = require 'request-promise'
Project       = require './project'
cache         = require './cache'
Log           = require './log'
SecretSauce   = require "../lib/util/secret_sauce_loader"

config   = require("konfig")()

class Keys
  Log: Log

  constructor: (projectRoot) ->
    if not (@ instanceof Keys)
      return new Keys(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/keys requires a projectRoot!")

    @cache     = cache
    @project   = Project(projectRoot)

  _getNewKeyRange: (projectId) ->
    url = "#{config.app.api_url}/projects/#{projectId}/keys"

    Log.info "Requesting new key range", {url: url}

    Request.post(url)

SecretSauce.mixin("Keys", Keys)

module.exports = Keys