const stream = require('stream')

module.exports = {
  passthruStream () {
    return new stream.PassThrough({
      highWaterMark: Number.MAX_SAFE_INTEGER,
    })
  },
}
