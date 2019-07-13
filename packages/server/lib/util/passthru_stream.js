const through = require('through')

module.exports = {
  passthruStream () {
    return through(function (chunk) {
      this.queue(chunk)
    })
  },
}
