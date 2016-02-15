_         = require("lodash")
fs        = require("fs-extra")
path      = require("path")
Promise   = require("bluebird")
request   = require("request-promise")
errors    = require("request-promise/errors")
config    = require("./config")
Project   = require("./project")
logger    = require("./logger")

CACHE = config.app.cache_path
fs    = Promise.promisifyAll(fs)

class Cache extends require("events").EventEmitter
  path: CACHE

  READ_VALIDATIONS: ->
    [
      @_ensureProjectKey
      @_ensureProjectRangeKey
    ]

  _ensureProjectKey: (contents) ->
    if !contents.PROJECTS?
      contents.PROJECTS = {}

    Promise.resolve(contents)

  _ensureProjectRangeKey: (contents) ->
    _.each contents.PROJECTS, (p) ->
      if !p.RANGE?
        p.RANGE = {}

    Promise.resolve(contents)

  ## Reads the contents of the local file
  ## returns a JSON object
  read: ->
    @ensureExists().bind(@).then ->
      fs.readJsonAsync(CACHE, 'utf8')
      .bind(@)
      .then (contents) ->
        Promise.reduce(@READ_VALIDATIONS(), (memo, fn) ->
          fn(memo)
        , contents)

  ## Writes over the contents of the local file
  ## takes in an object and serializes it into JSON
  ## finally returning the JSON object that was written
  _write: (obj = {}) ->
    logger.info("writing to .cy cache", cache: obj)

    @emit "write", obj
    fs.outputFileAsync(
      CACHE,
      JSON.stringify(obj),
    ).bind(@).return(obj)

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

    @_write contents

  _set: (key, val) ->
    @read().then (contents) ->
      @_mergeOrWrite(contents, key, val)

  _get: (key) ->
    @read().then (contents) ->
      contents[key]

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    logger.info "checking existence of .cy cache", path: CACHE

    fs.statAsync(CACHE)
    .bind(@)
    .return(true)
    .catch => @_write()

  exists: ->
    @ensureExists().return(true).catch(false)

  cache_path: CACHE

  updateRange: (id, range) ->
    logger.info "updating range of project #{id}", {range: range}

    @getProject(id).bind(@)
    .then (p) ->
      p.RANGE = range
      p
    .then (p) ->
       @updateProject(id, p)
       .return(p)

  updateProject: (id, data) ->
    logger.info "updating project #{id}", project: data

    @getProjects().then (projects) ->
      @getProject(id).then (project) =>
        projects[id] = _.extend(project, data)
        @_set "PROJECTS", projects
        .return(project)

  ensureProject: (id) ->
    @getProject(id)
    .bind(@)
    .catch(-> @insertProject(id))

  insertProject: (id) ->
    throw new Error("Cannot insert a project without an id!") if not id

    @getProjects().then (projects) ->
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
        fs.statAsync(path)
        .catch ->
          memo.push(path)
        .return(memo)
      , []

      pathsToRemove.then (removedPaths) =>
        process.nextTick =>
          Promise.each removedPaths, (path) =>
            @_removeProjectByPath(projects, path)

        ## return our paths without the ones we're
        ## about to remove
        return _.without(paths, removedPaths...)

  addProject: (path) ->
    logger.info "adding project from path", path: path

    project = Project(path)

    ## make sure we either have or receive an id
    project.ensureProjectId().then (id) =>
      ## make sure we've written it to the local .cy file
      @insertProject(id).then =>

        ## and make sure we have the correct path
        @updateProject(id, {PATH: path})

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

  remove: ->
    fs.removeSync CACHE

  getToken: (session) ->
    api.getToken(session)

  generateToken: (session) ->
    api.updateToken(session)

  getProjectIdByPath: (projectPath) ->
    @getProjects().then (projects) ->
      _.findKey(projects, {PATH: projectPath})

  _projectToken: (method, projectPath, session) ->
    @getProjectIdByPath(projectPath).then (projectId) ->
      if not projectId
        e = new Error
        e.projectNotFound = true
        e.projectPath = projectPath
        throw e
      else
        switch method
          when "get" then api.getProjectToken(projectId, session)
          when "put" then api.updateProjectToken(projectId, session)
          else
            throw new TypeError("Method not recognized. Expected 'get' or 'put', got: '#{method}'")

  getProjectToken: (project, session) ->
    @_projectToken("get", project, session)

  generateProjectToken: (project, session) ->
    @_projectToken("put", project, session)

module.exports = new Cache
