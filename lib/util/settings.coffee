_        = require "lodash"
Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

module.exports =
  _pathToCypressJson: (projectRoot) ->
    path.join(projectRoot, "cypress.json")

  _logErr: (projectRoot, err) ->
    throw new Error "Error reading from: #{projectRoot}/cypress.json\n#{err.message}"

    # console.log "Could not read file from: '#{projectRoot}/cypress.json'"

  _stringify: (obj) ->
    JSON.stringify(obj, null, 2)

  _get: (method, projectRoot) ->
    if not projectRoot
      throw new Error("Settings requires projectRoot to be defined!")

    file = @_pathToCypressJson(projectRoot)

    ## should synchronously check to see if cypress.json exists
    ## and if not, create an empty one
    if not fs.existsSync(file)
      fs.writeFileSync(file, @_stringify({cypress: {wizard: true}}))

    fs[method](file, "utf8")

  read: (projectRoot) ->
    @_get("readFileAsync", projectRoot)
    .then(JSON.parse)
    .get("cypress")
    .catch (err) =>
      @_logErr(projectRoot, err)

  readSync: (projectRoot) ->
    try
      str = @_get("readFileSync", projectRoot)

      return JSON.parse(str).cypress
    catch err
      @_logErr(projectRoot, err)

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