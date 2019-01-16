const stream = require('stream')

module.exports = (condition, dest) => {
  // if truthy return the dest stream
  if (condition) {
    return dest
  }

  // else passthrough the stream
  return stream.PassThrough()
}
