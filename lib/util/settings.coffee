_        = require("lodash")
Promise  = require("bluebird")
path     = require("path")
fs       = require("fs-extra")
errors   = require("../errors")

fs = Promise.promisifyAll(fs)

class WriteError extends Error
  constructor: (@message) ->
    @name = "WriteError"
    Error.captureStackTrace(@, WriteError)

module.exports =
  _pathToFile: (projectRoot, file) ->
    path.join(projectRoot, file)

  _err: (type, file, err) ->
    console.log arguments
    e = errors.get(type, file, err)
    e.code = err.code
    e.errno = err.errno
    throw e

  _logReadErr: (file, err) ->
    @_err("ERROR_READING_FILE", file, err)

  _logWriteErr: (file, err) ->
    @_err("ERROR_WRITING_FILE", file, err, WriteError)

  _stringify: (obj) ->
    JSON.stringify(obj, null, 2)

  _get: (method, projectRoot, options = {}) ->
    if not projectRoot
      throw new Error("Settings requires projectRoot to be defined!")

    _.defaults options,
      writeInitial: true

    file = @_pathToFile(projectRoot, options.file)

    ## should synchronously check to see if cypress.json exists
    ## and if not, create an empty one
    if not fs.existsSync(file) and options.writeInitial
      @_writeSync(file, {})

    fs[method](file)

  _write: (file, obj = {}) ->
    fs.writeFileAsync(file, @_stringify(obj))
    .return(obj)
    .catch (err) =>
      @_logWriteErr(file, err)

  _writeSync: (file, obj = {}) ->
    try
      fs.writeFileSync(file, @_stringify(obj))
      return obj

    catch err
      @_logWriteErr(file, err)

  read: (projectRoot) ->
    file = @_pathToFile(projectRoot, "cypress.json")

    ## must re-wrap this because readJsonAsync may
    ## throw a sync error from _writeSync
    Promise.try =>
      @_get("readJsonAsync", projectRoot, {file: "cypress.json"})
      .then (obj) =>
        if settings = obj.cypress
          @_write(file, settings)
        else
          obj
      .catch (err) =>
        throw err if err instanceof WriteError

        @_logReadErr(file, err)

  readEnvSync: (projectRoot) ->
    options = {
      file: "cypress.env.json"
      writeInitial: false
    }

    try
      @_get("readJsonSync", projectRoot, options)
    catch err
      ## dont catch errors if
      ## there wasnt a cypress.env.json
      if err.code is "ENOENT"
        return {}

      throw err if err instanceof WriteError

      ## TODO: this should not be project root
      ## it should be projectRoot + cypress.env.json
      @_logReadErr(projectRoot, err, options.file)

  readSync: (projectRoot) ->
    options = {
      file: "cypress.json"
    }

    file = @_pathToFile(projectRoot, "cypress.json")

    try
      obj = @_get("readJsonSync", projectRoot, options)

      if settings = obj.cypress
        @_writeSync(file, settings)
      else
        obj
    catch err
      throw err if err instanceof WriteError

      @_logReadErr(file, err)

  write: (projectRoot, obj = {}) ->
    @read(projectRoot).bind(@).then (settings) ->
      _.extend settings, obj

      file = @_pathToFile(projectRoot, "cypress.json")

      @_write(file, settings)

  remove: (projectRoot) ->
    fs.unlinkSync @_pathToFile(projectRoot, "cypress.json")

  pathToCypressJson: (projectRoot) ->
    @_pathToFile(projectRoot, "cypress.json")
