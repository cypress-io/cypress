_          = require("lodash")
fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
request    = require("request-promise")
errors     = require("request-promise/errors")
appData    = require("./util/app_data")
api        = require("./api")
logger     = require("./logger")

CACHE = appData.path("cache")
fs    = Promise.promisifyAll(fs)

current = null

queue = (fn) ->
  if current
    Promise.delay(20)
    .then ->
      queue(fn)

  else
    current = true

    Promise
    .try(fn)
    .finally ->
      current = null

module.exports = {
  path: CACHE

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    fs.readJsonAsync(@path)
    .then (json) =>
      if not json.USER
        json.USER = {}

      if not json.PROJECTS
        json.PROJECTS = []

      @write(json)
    .then (json) =>
      ## if our project structure is not
      ## an array then its legacy and we
      ## need to convert it
      if not _.isArray(json.PROJECTS)
        json = @convertLegacyCache(json)
        @write(json)
    .return(true)
    .catch =>
      @write(@defaults())

  exists: ->
    @ensureExists().return(true).catch(false)

  defaults: ->
    {
      USER: {}
      PROJECTS: []
    }

  convertLegacyCache: (json) ->
    json.PROJECTS = _.chain(json.PROJECTS).values().map("PATH").compact().value()
    json

  ## Reads the contents of the local file
  ## returns a JSON object
  _read: ->
    @ensureExists()
    .then =>
      fs.readJsonAsync(@path)

  ## Writes over the contents of the local file
  ## takes in an object and serializes it into JSON
  ## finally returning the JSON object that was written
  write: (obj = {}) ->
    logger.info("writing to .cy cache", cache: obj)

    fs
    .outputJsonAsync(@path, obj, {spaces: 2})
    .return(obj)

  _mergeOrWrite: (contents, key, val) ->
    switch
      when _.isString(key)
        ## if key is a string then we need to merge
        ## its value into key
        contents[key] ?= {}
        _.extend(contents[key], val)
      when _.isObject(key)
        ## else merge key/val directly into
        ## contents potentially overwriting data
        _.extend contents, key

    @write contents

  _set: (key, val) ->
    @_read().then (contents) =>
      @_mergeOrWrite(contents, key, val)

  _get: (key) ->
    @_read().then (contents) ->
      contents[key]

  _getProjects: ->
    @_get("PROJECTS")

  _removeProjects: (projects, paths) ->
    ## normalize paths in array
    projects = _.without(projects, [].concat(paths)...)

    @_set {PROJECTS: projects}

  read: ->
    queue =>
      @_read()

  getProjectPaths: ->
    queue =>
      @_getProjects().then (projects) =>
        pathsToRemove = Promise.reduce projects, (memo, path) ->
          fs.statAsync(path)
          .catch ->
            memo.push(path)
          .return(memo)
        , []

        pathsToRemove.then (removedPaths) =>
          @_removeProjects(projects, removedPaths)
        .then =>
          @_getProjects()

  removeProject: (path) ->
    queue =>
      @_getProjects().then (projects) =>
        @_removeProjects(projects, path)

  insertProject: (path) ->
    queue =>
      @_getProjects().then (projects) =>
        ## bail if we already have this path
        return projects if path in projects

        projects.push(path)
        @_set("PROJECTS", projects)

  getUser: ->
    logger.info "getting user"

    queue =>
      @_get("USER")

  setUser: (user) ->
    logger.info "setting user", user: user

    queue =>
      @_set {USER: user}

  removeUser: ->
    queue =>
      @_set({USER: {}})

  remove: ->
    fs.removeAsync(@path)

  removeSync: ->
    fs.removeSync(@path)

}