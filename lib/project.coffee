_        = require 'lodash'
Settings = require('./util/settings')
Promise  = require 'bluebird'
Request  = require 'request-promise'
fs       = Promise.promisifyAll(require('fs'))
API_URL  = process.env.API_URL or 'localhost:1234'

class Project extends require('./logger')
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
      @updateSettings(eclectus: {projectID: JSON.parse(attrs).uuid})
    .then (settings) -> settings.projectID

  getProjectId:->
    @emit "verbose", "Looking up project ID"
    Settings.read()
    .then (settings) ->
      if (settings.eclectus.projectID)
        return settings.eclectus.projectID
      throw new Error("No project ID found")

  updateSettings: (settings) ->
    @emit "verbose", "Updating Project settings with #{JSON.stringify(settings, null, 4)}"
    Settings.read()
    .then (obj) ->
      settings.eclectus = _.extend(obj.eclectus, settings.eclectus)
      settings
    .then (obj) ->
      fs.writeFileAsync("eclectus.json", JSON.stringify(obj, null, 2))
      .then -> obj.eclectus

module.exports = Project
