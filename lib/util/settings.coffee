_        = require("lodash")
Promise  = require("bluebird")
path     = require("path")
fs       = require("fs-extra")

fs       = Promise.promisifyAll(fs)

module.exports =
  _pathToCypressJson: (projectRoot) ->
    path.join(projectRoot, "cypress.json")

  _pathToFile: (projectRoot, file) ->
    path.join(projectRoot, file)

  _logErr: (projectRoot, err, file) ->
    file ?= "cypress.json"

    throw new Error "Error reading from: #{projectRoot}/#{file}\n#{err.message}"

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
      fs.writeFileSync(file, @_stringify({cypress: {}}))

    fs[method](file)

  read: (projectRoot) ->
    @_get("readJsonAsync", projectRoot, {file: "cypress.json"})
    .get("cypress")
    .catch (err) =>
      @_logErr(projectRoot, err)

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

      @_logErr(projectRoot, err, options.file)

  readSync: (projectRoot) ->
    options = {
      file: "cypress.json"
    }

    try
      obj = @_get("readJsonSync", projectRoot, options)

      return obj.cypress
    catch err
      @_logErr(projectRoot, err, options.file)

  write: (projectRoot, obj = {}) ->
    @read(projectRoot).bind(@).then (settings) ->
      _.extend settings, obj

      fs.writeFileAsync(
        @_pathToCypressJson(projectRoot),
        @_stringify({cypress: settings})
      )
      .return(settings)

  writeSync: ->

  remove: (projectRoot) ->
    fs.unlinkSync @_pathToCypressJson(projectRoot)