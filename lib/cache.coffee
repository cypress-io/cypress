_          = require("lodash")
fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
PSemaphore = require("promise-semaphore")
request    = require("request-promise")
errors     = require("request-promise/errors")
appData    = require("./util/app_data")
api        = require("./api")
logger     = require("./logger")

CACHE = appData.path("cache")
fs    = Promise.promisifyAll(fs)
queue = new PSemaphore

module.exports = {
  path: CACHE

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    queue.add =>
      fs.readJsonAsync(CACHE)
      .then (json) =>
        if not json.USER
          json.USER = {}

        if not json.PROJECTS
          json.PROJECTS = []

        @write(json, false)
      .then (json) =>
        ## if our project structure is not
        ## an array then its legacy and we
        ## need to convert it
        if not _.isArray(json.PROJECTS)
          json = @convertLegacyCache(json)
          @write(json, false)
      .return(true)
      .catch =>
        @write(@defaults(), false)

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
  read: ->
    @ensureExists()
    .then ->
      queue.add =>
        fs.readJsonAsync(CACHE)

  ## Writes over the contents of the local file
  ## takes in an object and serializes it into JSON
  ## finally returning the JSON object that was written
  write: (obj = {}, enableQueue = true) ->
    logger.info("writing to .cy cache", cache: obj)

    write = ->
      fs
      .outputJsonAsync(CACHE, obj, {spaces: 2})
      .return(obj)

    if enableQueue
      queue.add(write)
    else
      write()

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
    @read().then (contents) =>
      @_mergeOrWrite(contents, key, val)

  _get: (key) ->
    @read().then (contents) ->
      contents[key]

  insertProject: (path) ->
    @_getProjects().then (projects) =>
      ## bail if we already have this path
      return projects if path in projects

      projects.push(path)
      @_set("PROJECTS", projects)

  _getProjects: ->
    @_get("PROJECTS")

  _removeProjects: (projects, paths) ->
    ## normalize paths in array
    projects = _.without(projects, [].concat(paths)...)

    @_set {PROJECTS: projects}

  getProjectPaths: ->
    @_getProjects().then (projects) =>
      pathsToRemove = Promise.reduce projects, (memo, path) ->
        queue.add ->
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
    @_getProjects().then (projects) =>
      @_removeProjects(projects, path)

  getUser: ->
    logger.info "getting user"

    @_get("USER")

  setUser: (user) ->
    logger.info "setting user", user: user

    @_set {USER: user}

  removeUser: ->
    @_set({USER: {}})

  remove: ->
    fs.removeAsync(CACHE)

  removeSync: ->
    fs.removeSync CACHE

}