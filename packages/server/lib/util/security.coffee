stream = require("stream")
replacestream = require("replacestream")

## match the word 'top' or 'parent' as long as its prefixed
## by a letter or number or followed by a letter or number
topOrParentRe = /([^\d|a-zA-Z]){1}(top|parent)([^\d|a-zA-Z]){1}/g

strip = (html) ->
  html.replace(topOrParentRe, "$1self$3") ## replace top with 'self'

stripStream = ->
  replacestream(topOrParentRe, "$1self$3")

module.exports = {
  strip

  stripStream
}
