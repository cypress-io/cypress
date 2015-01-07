Promise  = require 'bluebird'
fs       = Promise.promisifyAll(require('fs'))

module.exports =
  read: ->
    fs.readFileAsync("eclectus.json", "utf8")
    .then (obj) ->
      JSON.parse(obj)

  update: ->
