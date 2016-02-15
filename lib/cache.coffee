_          = require("lodash")
fs         = require("fs-extra")
path       = require("path")
Promise    = require("bluebird")
PSemaphore = require("promise-semaphore")
request    = require("request-promise")
errors     = require("request-promise/errors")
api        = require("./api")
config     = require("./config")
logger     = require("./logger")

CACHE = config.app.cache_path
fs    = Promise.promisifyAll(fs)
queue = new PSemaphore

module.exports = {
  pathToCache: CACHE

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    logger.info "checking existence of .cy cache", path: CACHE

    queue.add =>
      fs.statAsync(CACHE)
      .return(true)
      .catch =>
        @write @defaults()

  exists: ->
    @ensureExists().return(true).catch(false)

  defaults: ->
    {
      USER: {}
      PROJECTS: {}
    }

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
  write: (obj = {}) ->
    logger.info("writing to .cy cache", cache: obj)

    queue.add ->
      fs
      .outputJsonAsync(CACHE, obj, {spaces: 2})
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
    @read().then (contents) =>
      @_mergeOrWrite(contents, key, val)

  _get: (key) ->
    @read().then (contents) ->
      contents[key]

  updateProject: (id, path) ->
    @getProjects().then (projects) =>
      @getProject(id).then (project) =>
        projects[id] = _.extend(project, {PATH: path})
        @_set "PROJECTS", projects
        .return(project)

  insertProject: (id) ->
    throw new Error("Cannot insert a project without an id!") if not id

    @getProjects().then (projects) =>
      ## bail if we already have a project
      return if projects[id]

      ## create an empty nested object
      obj = {}
      obj[id] = {}
      @_set("PROJECTS", obj)

  getProject: (id) ->
    @getProjects().then (projects) ->
      if (project = projects[id])
        return project

      throw new Error("Project #{id} not found")

  getProjects: ->
    @_get("PROJECTS")

  _removeProjectByPath: (projects, path) ->
    projects = _.omit projects, (project, key) ->
      project.PATH is path

    @_set {PROJECTS: projects}

  getProjectPaths: ->
    @getProjects().then (projects) ->
      paths = _.pluck(projects, "PATH")

      pathsToRemove = Promise.reduce paths, (memo, path) ->
        queue.add =>
          fs.statAsync(path)
          .catch ->
            memo.push(path)
          .return(memo)
      , []

      pathsToRemove.then (removedPaths) =>
        # process.nextTick =>
          # Promise.each removedPaths, (path) =>
            # @_removeProjectByPath(projects, path)

        ## return our paths without the ones we're
        ## about to remove
        return _.without(paths, removedPaths...)

  removeProject: (path) ->
    logger.info "removing project from path", path: path

    @getProjects().then (projects) ->
      @_removeProjectByPath(projects, path)

  getUser: ->
    logger.info "getting user"

    @_get("USER")

  setUser: (user) ->
    logger.info "setting user", user: user

    @_set {USER: user}

  removeUser: ->
    @_set({USER: null})

  removeSync: ->
    fs.removeSync CACHE

  getToken: (session) ->
    api.getToken(session)

  generateToken: (session) ->
    api.updateToken(session)

  getProjectIdByPath: (projectPath) ->
    @getProjects().then (projects) ->
      _.findKey(projects, {PATH: projectPath})

}