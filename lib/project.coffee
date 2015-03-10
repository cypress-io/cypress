_        = require 'lodash'
Promise  = require 'bluebird'
Request  = require 'request-promise'
fs       = require 'fs'
path     = require 'path'
Log      = require "./log"
Settings = require './util/settings'

fs       = Promise.promisifyAll(fs)

config   = require("konfig")()

class Project
  constructor: (projectRoot) ->
    if not (@ instanceof Project)
      return new Project(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/projects requires a projectRoot!")

    @projectRoot = projectRoot

  ## A simple helper method
  ## to create a project ID if we do not already
  ## have one
  ensureProjectId: ->
    @getProjectId().bind(@)
    .catch(@createProjectId)

  createProjectId: ->
    Log.info "Creating Project ID"

    Request.post("#{config.app.api_url}/projects")
    .then (attrs) =>
      attrs = {projectId: JSON.parse(attrs).uuid}
      Log.info "Writing Project ID", _.clone(attrs)
      Settings.write(@projectRoot, attrs)
    .get("projectId")

  getProjectId: ->
    Settings.read(@projectRoot)
    .then (settings) ->
      if (id = settings.projectId)
        Log.info "Returning Project ID", {id: id}
        return id

      Log.info "No Project ID found"
      throw new Error("No project ID found")

module.exports = Project