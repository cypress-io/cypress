_        = require 'lodash'
Settings = require './util/settings'
Promise  = require 'bluebird'
Request  = require 'request-promise'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

config   = require("konfig")()

class Project extends require('./logger')
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/projects requires a projectRoot!")

    @projectRoot = projectRoot

    super

  ## A simple helper method
  ## to create a project ID if we do not already
  ## have one
  ensureProjectId: ->
    @emit "verbose", "Ensuring project ID"
    @getProjectId().bind(@)
    .catch(@createProjectId)

  createProjectId: ->
    @emit "verbose", "Creating project ID"
    Request.post("#{config.app.api_url}/projects")
    .then (attrs) =>
      Settings.write(@projectRoot, {projectId: JSON.parse(attrs).uuid})
    .get("projectId")

  getProjectId: ->
    @emit "verbose", "Looking up project ID"
    Settings.read(@projectRoot)
    .then (settings) ->
      if (id = settings.projectId)
        return id
      throw new Error("No project ID found")

module.exports = Project