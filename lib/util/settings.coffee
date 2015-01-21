Promise  = require 'bluebird'
path     = require 'path'
fs       = Promise.promisifyAll(require('fs'))

module.exports =
  read: (config) ->
    fs.readFileAsync(
      path.join(config.projectRoot, "eclectus.json"),
      "utf8"
    )
    .then (obj) ->
      JSON.parse(obj)
    .catch (err) ->
      console.error err
      debugger

  update: ->
