_         = require 'lodash'
Promise   = require 'bluebird'
path      = require 'path'
fs        = Promise.promisifyAll(require('fs'))
LOCATION  = path.join(__dirname, '../', '.cy/', 'local.info')

class AppInfo extends require('./logger')
  READ_VALIDATIONS: =>
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
  _read: ->
    fs.readFileAsync(LOCATION, 'utf8')
    .then(JSON.parse)
    .then (contents) =>
      Promise.reduce(@READ_VALIDATIONS(), (memo, fn) ->
        fn(memo)
      , contents)

  ## Writes over the contents of the local file
  ## takes in an object and serializes it into JSON
  ## finally returning the JSON object that was written
  _write: (obj={}) =>
    fs.writeFileAsync(
      LOCATION,
      JSON.stringify(obj),
      'utf8'
    ).then(obj)

  ## Creates the local info directory and file
  _initLocalInfo: =>
    fs.mkdirAsync(
      path.dirname(LOCATION)
    )
    .then(@_write)

  ## Checks to make sure if the local file is already there
  ## if so returns true;
  ## otherwise it inits an empty JSON config file
  ensureExists: ->
    fs.statAsync(LOCATION)
    .then(-> true)
    .catch(@_initLocalInfo)

  updateRange: (id, range) ->
    @getProject(id)
    .then (p) ->
      p.RANGE = range
      p
    .then (p) =>
       @updateProject(id, p)
       .then(p)

  updateProject: (id, data) ->
    @_read()
    .then (contents) =>
      contents.PROJECTS[id] = data
      @_write(contents)
      .then -> data

  ensureProject: (id) ->
    @getProject(id)
    .then(id)
    .catch(=> @addProject(id))

  getProject: (id) ->
    @_read()
    .then (contents) =>
      if (p = contents.PROJECTS[id])
        return p

      throw new Error("Project #{id} not found")

  addProject: (id) ->
    @_read()
    .then (contents) =>

      ## If we already have a project entry
      ## return the file contents
      if (contents.PROJECTS[id])
        return contents

      contents.PROJECTS[id] = {}
      @_write(contents)

module.exports = AppInfo
