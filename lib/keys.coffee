_             = require("lodash")
path          = require("path")
Promise       = require("bluebird")
Project       = require("./project")
cache         = require("./cache")
api           = require("./api")
logger        = require("./logger")

class Keys
  constructor: (projectRoot) ->
    if not (@ instanceof Keys)
      return new Keys(projectRoot)

    if not projectRoot
      throw new Error("Instantiating lib/keys requires a projectRoot!")

    @project   = Project(projectRoot)

  _convertToId: (index) ->
    ival = index.toString(36)
    ## 0 pad number to ensure three digits
    [0,0,0].slice(ival.length).join("") + ival

  _getProjectKeyRange: (id) ->
    cache.getProject(id).get("RANGE")

  _getNewKeyRange: (projectId) ->
    cache.getUser().then (user = {}) =>
      api.createKeyRange(projectId, user.session_token)

  ## Lookup the next Test integer and update
  ## offline location of sync
  getNextTestNumber: (projectId) ->
    @_getProjectKeyRange(projectId)
    .then (range) =>
      return @_getNewKeyRange(projectId) if range.start is range.end

      range.start += 1
      range
    .then (range) =>
      range = JSON.parse(range) if _.isString(range)
      logger.info "Received key range", {range: range}
      cache.updateRange(projectId, range)
      .return(range.start)

  nextKey: ->
    @project.ensureProjectId().bind(@)
    .then (projectId) ->
      cache.ensureProject(projectId).bind(@)
      .then -> @getNextTestNumber(projectId)
      .then @_convertToId

module.exports = Keys