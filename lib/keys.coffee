_             = require 'lodash'
Promise       = require 'bluebird'
path          = require 'path'
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

SecretSauce.mixin("Keys", Keys)

module.exports = Keys