const valid = require('./valid-module')
const invalid = require('./accessing-buffer')

function entry() {
  return valid() + invalid()
}

module.exports = entry
