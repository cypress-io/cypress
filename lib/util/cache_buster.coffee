_     = require 'lodash'

DIGITS = 3
SEPERATOR = "-"

module.exports =
  get: ->
    SEPERATOR + Math.random().toFixed(DIGITS).slice(2, 5)

  strip: (str) ->
    if @_hasCacheBuster(str)
      str.slice(0, -4)
    else
      str

  _hasCacheBuster: (str) ->
    str.split("").slice(-4, -3).join("") is SEPERATOR