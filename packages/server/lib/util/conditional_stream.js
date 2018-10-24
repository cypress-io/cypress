stream = require("stream")

module.exports = (condition, dest) ->
  ## if truthy return the dest stream
  return dest if condition

  ## else passthrough the stream
  stream.PassThrough()
