_        = require 'lodash'
Promise  = require 'bluebird'
path     = require 'path'
Request  = require 'request-promise'
Project  = require './project'
fs       = Promise.promisifyAll(require('fs'))
API_URL  = process.env.API_URL or 'localhost:1234'
AppInfo  = require './app_info'

class Keys
  constructor: ->
    @AppInfo = new AppInfo
    @Project = new Project(app.get('config'))

  _getNewKeyRange: =>
    @Project.ensureProjectId()
    .then (projectID) ->
      Request.post("http://#{API_URL}/projects/#{projectID}/keys")

  ## Lookup the next Test integer and update
  ## offline location of sync
  _getNextTestNumber: =>
    @Project.ensureProjectId()
    .then (projectId) =>
      @_getProjectKeyRange(projectId)
      .then (range) =>
        if (range.start is range.end)
          return @_getNewKeyRange()

        next = range.start
        range.start++

        if (range.start is range.end)
          return @_getNewKeyRange()
        range
      .then (range) =>
        range = JSON.parse(range) if typeof range is "string"
        @AppInfo.updateRange(projectId, range)
        .then -> range.start

  _convertToId: (index) ->
    ival = index.toString(36)
    ## 0 pad number to ensure three digits
    [0,0,0].slice(ival.length).join("")+ival

  _getProjectKeyRange: (id) ->
    @AppInfo.getProject(id)
    .then (project) -> project.RANGE

  nextKey: (app) ->
    @Project.ensureProjectId()
    .then (projectId) =>
      @AppInfo.ensureExists()
      .then => @AppInfo.ensureProject(projectId)
      .then @_getNextTestNumber
      .then @_convertToId

module.exports = Keys
