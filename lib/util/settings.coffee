Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

module.exports =
  _get: (projectRoot, method) ->
    fs[method](
      path.join(projectRoot, "cypress.json"),
      "utf8"
    )
    .then(JSON.parse)
    .get("cypress")
    .catch (err) ->
      console.error err
      debugger

  read: (projectRoot) ->
    @_get(projectRoot, "readFileAsync")

  readSync: (projectRoot) ->
    @_get(projectRoot, "readFileSync")

  update: ->
