global.config ?= require("konfig")()

_         = require 'lodash'
Promise   = require 'bluebird'
path      = require 'path'
request   = require "request-promise"
Project   = require './project'
Log       = require "./log"
Routes    = require "./util/routes"
fs        = require 'fs-extra'
CACHE     = config.app.cache_path

fs = Promise.promisifyAll(fs)

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
    Log.info("writing to .cy cache", cache: obj)

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
    Log.info "checking existence of .cy cache", path: CACHE

    fs.statAsync(CACHE)
    .bind(@)
    .return(true)
    .catch => @_write()

  exists: ->
    @ensureExists().return(true).catch(false)

  cache_path: CACHE

  updateRange: (id, range) ->
    Log.info "updating range of project #{id}", {range: range}

    @getProject(id).bind(@)
    .then (p) ->
      p.RANGE = range
      p
    .then (p) ->
       @updateProject(id, p)
       .return(p)

  updateProject: (id, data) ->
    Log.info "updating project #{id}", project: data

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
    Log.info "adding project from path", path: path

    project = Project(path)

    ## make sure we either have or receive an id
    project.ensureProjectId().then (id) =>
      ## make sure we've written it to the local .cy file
      @insertProject(id).then =>

        ## and make sure we have the correct path
        @updateProject(id, {PATH: path})

  removeProject: (path) ->
    Log.info "removing project from path", path: path

    @getProjects().then (projects) ->
      @_removeProjectByPath(projects, path)

  getUser: ->
    Log.info "getting user"

    @_get("USER")

  setUser: (user) ->
    Log.info "setting user", user: user

    @_set {USER: user}

  remove: ->
    fs.removeSync CACHE

  _token: (method, session) ->
    url = Routes.token()
    headers = {"X-Session": session}
    request({method: method, url: url, headers: headers, json: true})
      .promise().get("api_token")

  getToken: (session) ->
    @_token("get", session)

  generateToken: (session) ->
    @_token("put", session)

  _projectToken: (method, session, projectPath) ->
    @getProjects().then (projects) ->
      if not projectId = _.findKey(projects, {PATH: projectPath})
        e = new Error
        e.projectNotFound = true
        e.projectPath = projectPath
        throw e
      else
        request({
          method:  method
          url:     Routes.projectToken(projectId)
          headers: {"X-Session": session}
          json:    true
        }).promise().get("api_token")

  getProjectToken: (session, project) ->
    @_projectToken("get", session, project)

  generateProjectToken: (session, project) ->
    @_projectToken("put", session, project)

  ## move this to an auth module
  ## and update NW references
  logIn: (code) ->
    url = Routes.signin({code: code})
    request.post(url, {json: true})
      .catch (err) ->
        ## normalize the error object
        throw (err.error or err)

  logOut: (token) ->
    nukeSession = (resolve, reject) ->
      @_get("USER")
      .then (user = {}) =>
        user.session_token = null
        @_set({USER: user})
      .then(resolve)
      .catch(reject)

    url = Routes.signout()
    headers = {"X-Session": token}

    new Promise (resolve, reject) =>
      nukeSession = _.bind(nukeSession, @, resolve, reject)

      request.post({url: url, headers: headers})
        .then(nukeSession)
        .catch(nukeSession)

module.exports = new Cache
