_             = require 'lodash'
Promise       = require 'bluebird'
path          = require 'path'
Project       = require './project'
cache         = require './cache'
Log           = require './log'
Routes        = require './util/routes'
SecretSauce   = require "./util/secret_sauce_loader"

class Keys
  Log:    Log
  cache:  cache
  Routes: Routes

  constructor: (projectRoot) ->
    if not (@ instanceof Keys)
      return new Keys(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/keys requires a projectRoot!")

    @project   = Project(projectRoot)

SecretSauce.mixin("Keys", Keys)

module.exports = Keys