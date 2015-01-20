_         = require 'lodash'
Promise   = require 'bluebird'
path      = require 'path'
Project   = require './project'
fs        = Promise.promisifyAll(require('fs'))
LOCATION  = path.join(__dirname, '../', '.cy/', 'local.info')

class AppInfo extends require('./logger')
  READ_VALIDATIONS: ->
    [
      @_ensureProjectKey
      @_ensureProjectRangeKey
    ]

  _ensureProjectKey: (contents) =>
    @emit 'verbose', 'ensuring project key'
    if !contents.PROJECTS?
      contents.PROJECTS = {}

    Promise.resolve(contents)

  _ensureProjectRangeKey: (contents) =>
    @emit 'verbose', 'ensuring project range key'
    _.each contents.PROJECTS, (p) ->
      if !p.RANGE?
        p.RANGE = {}

    Promise.resolve(contents)

  ## Reads the contents of the local file
  ## returns a JSON object
  _read: =>
    @emit 'verbose', 'reading from .cy info'
    fs.readFileAsync(LOCATION, 'utf8')
    .bind(@)
    .then(JSON.parse)
    .then (contents) ->
      Promise.reduce(@READ_VALIDATIONS(), (memo, fn) ->
        fn(memo)
      , contents)

  ## Writes over the contents of the local file
  ## takes in an object and serializes it into JSON
  ## finally returning the JSON object that was written
  _write: (obj={}) ->
    @emit 'verbose', 'writing to .cy info'
    fs.writeFileAsync(
      LOCATION,
      JSON.stringify(obj),
      'utf8'
    ).bind(@).return(obj)

  _normalizeObj: (key, val) ->
    return key if _.isObject(key)

    obj = {}
    obj[key] = val
    obj

  _set: (key, val) ->
    obj = @_normalizeObj(key, val)

    @emit 'verbose', 'merging into .cy'

    @_read().then (contents) ->
      @_write(_.extend contents, obj)

  _get: (key) ->
    @_read().then (contents) ->
      contents[key]

  ## Creates the local info directory and file
  _initLocalInfo: ->
    @emit 'verbose', 'creating initial .cy info'
    fs.mkdirAsync(
      path.dirname(LOCATION)
    )
    .bind(@)
    .then(@_write)

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    @emit 'verbose', 'checking existence of .cy info'
    fs.statAsync(LOCATION)
    .bind(@)
    .return(true)
    .catch(@_initLocalInfo)

  updateRange: (id, range) ->
    @emit 'verbose', "updating range of project #{id} with #{JSON.stringify(range)}"
    @getProject(id)
    .then (p) ->
      p.RANGE = range
      p
    .then (p) ->
       @updateProject(id, p)
       .then(p)

  updateProject: (id, data) ->
    @emit 'verbose', "updating project #{id} with #{JSON.stringify(data)}"
    @getProjects().then (projects) ->
      @getProject(id).then (project) ->
        projects[id] = _.extend(project, data)
        @_set "PROJECTS", projects
        .return(project)

  ensureProject: (id) ->
    @emit 'verbose', "ensuring that project #{id} exists"
    @getProject(id)
    .then(id)
    .catch(-> @addProject(id))

  insertProject: (id) ->
    throw new Error("Cannot insert a project without an id!") if not id

    @getProjects().then (projects) ->
      ## bail if we already have a project
      return if projects[id]

      @emit 'verbose', "inserting project id: #{id}"

      ## create an empty nested object
      obj = {}
      obj[id] = {}
      @_set("PROJECTS", obj)

  getProject: (id) ->
    @emit 'verbose', "reading from project #{id}"

    @getProjects().then (projects) ->
      if (project = projects[id])
        return project

      throw new Error("Project #{id} not found")

  getProjects: ->
    @emit "verbose", "reading from all projects"

    @_get("PROJECTS")

  addProject: (path) ->
    @emit "verbose", "adding project from path: #{path}"

    project = new Project({projectRoot: path})

    ## make sure we either have or receive an id
    project.ensureProjectId().then (id) =>
      ## make sure we've written it to the local .cy file
      @insertProject(id).then =>

        ## and make sure we have the correct path
        @updateProject(id, {PATH: path})

  getSessionId: ->
    @emit "verbose", "getting session id"

    @_get("SESSION_ID")

  setSessionId: (id) ->
    @emit "verbose", "setting session id: #{id}"

    @_set("SESSION_ID", id)

module.exports = AppInfo
