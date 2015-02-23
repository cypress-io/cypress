_             = require 'lodash'
Promise       = require 'bluebird'
path          = require 'path'
Request       = require 'request-promise'
Project       = require './project'
Cache         = require './cache'
SecretSauce   = require "../lib/util/secret_sauce_loader"

config   = require("konfig")()

class Keys
  constructor: (projectRoot) ->
    if not (@ instanceof Keys)
      return new Keys(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/keys requires a projectRoot!")

    @cache     = new Cache
    @project   = Project(projectRoot)

  _getNewKeyRange: (projectId) ->
    Request.post("#{config.app.api_url}/projects/#{projectId}/keys")

SecretSauce.mixin("Keys", Keys)

module.exports = Keys