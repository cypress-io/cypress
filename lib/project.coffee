_        = require 'lodash'
Settings = require './util/settings'
Promise  = require 'bluebird'
Request  = require 'request-promise'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))
API_URL  = process.env.API_URL or 'localhost:1234'

class Project extends require('./logger')
  constructor: (@projectRoot) ->
    super

  ## A simple helper method
  ## to create a project ID if we do not already
  ## have one
  ensureProjectId: =>
    @emit "verbose", "Ensuring project ID"
    @getProjectId()
    .catch(@createProjectId)

  createProjectId: =>
    @emit "verbose", "Creating project ID"
    Request.post("http://#{API_URL}/projects")
    .then (attrs) =>
      @updateSettings(cypress: {projectID: JSON.parse(attrs).uuid})
    .then (settings) -> settings.projectID

  getProjectId: ->
    @emit "verbose", "Looking up project ID"
    Settings.read(@projectRoot)
    .then (settings) ->
      if (id = settings.projectID)
        return id
      throw new Error("No project ID found")

  updateSettings: (settings) =>
    @emit "verbose", "Updating Project settings with #{JSON.stringify(settings, null, 4)}"
    Settings.read(@projectRoot)
    .then (obj) =>
      _.extend(obj, settings.cypress)
    .then (obj) =>
      fs.writeFileAsync(
        path.join(@projectRoot, "cypress.json"),
        JSON.stringify(obj, null, 2)
      )
      .then -> obj

module.exports = Project
