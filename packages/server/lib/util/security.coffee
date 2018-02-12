stream = require("stream")
replacestream = require("replacestream")

topOrParentRe = /.*(top|parent).*/g
topOrParentEqualityBeforeRe = /((?:window|self).*[!=][=]\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)/g
topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=][=].*(?:window|self))/g
topOrParentLocationOrFramesRe = /([^\da-zA-Z])(top|parent)([.])(location|frames)/g

replacer = (match, p1, offset, string) ->
  match
  .replace(topOrParentEqualityBeforeRe, "$1self")
  .replace(topOrParentEqualityAfterRe, "self$2")
  .replace(topOrParentLocationOrFramesRe, "$1self$3$4")

strip = (html) ->
  html.replace(topOrParentRe, replacer)

stripStream = ->
  replacestream(topOrParentRe, replacer)

module.exports = {
  strip

  stripStream
}
