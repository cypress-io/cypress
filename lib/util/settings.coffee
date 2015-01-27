_        = require "lodash"
Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

module.exports =
  _pathToCypressJson: (projectRoot) ->
    path.join(projectRoot, "cypress.json")

  _logErr: (projectRoot) ->
    console.log "Could not read file from: '#{projectRoot}/cypress.json'"

  _get: (method, projectRoot) ->
    if not projectRoot
      throw new Error("Settings requires projectRoot to be defined!")

    fs[method](
      @_pathToCypressJson(projectRoot),
      "utf8"
    )

  read: (projectRoot) ->
    @_get("readFileAsync", projectRoot)
    .then(JSON.parse)
    .get("cypress")
    .catch (err) =>
      @_logErr(projectRoot)

  readSync: (projectRoot) ->
    try
      str = @_get("readFileSync", projectRoot)

      return JSON.parse(str).cypress
    catch e
      @_logErr(projectRoot)

  write: (projectRoot, obj = {}) ->
    @read(projectRoot).bind(@).then (settings) ->
      _.extend settings, obj

      fs.writeFileAsync(
        @_pathToCypressJson(projectRoot),
        JSON.stringify({cypress: settings})
      )
      .return(settings)

  writeSync: ->
