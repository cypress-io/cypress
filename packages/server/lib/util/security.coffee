stream = require("stream")
pumpify = require("pumpify")
replacestream = require("replacestream")

topOrParentEqualityBeforeRe = /((?:window|self)(?:\.|\[['"](?:top|self)['"]\])?\s*[!=][=]\s*(?:(?:window|self)(?:\.|\[['"]))?)(top|parent)/g
topOrParentEqualityAfterRe = /(top|parent)((?:["']\])?\s*[!=][=]=?\s*(?:window|self))/g
topOrParentLocationOrFramesRe = /([^\da-zA-Z])(top|parent)([.])(location|frames)/g

strip = (html) ->
  html
  .replace(topOrParentEqualityBeforeRe, "$1self")
  .replace(topOrParentEqualityAfterRe, "self$2")
  .replace(topOrParentLocationOrFramesRe, "$1self$3$4")

stripStream = ->
  pumpify(
    replacestream(topOrParentEqualityBeforeRe, "$1self")
    replacestream(topOrParentEqualityAfterRe, "self$2")
    replacestream(topOrParentLocationOrFramesRe, "$1self$3$4")
  )

module.exports = {
  strip

  stripStream
}
