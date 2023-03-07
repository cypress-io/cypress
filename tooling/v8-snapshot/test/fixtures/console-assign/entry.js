const invalid = require('./reassign-console')
const valid = require('./using-console')

function entry() {
  return valid() + invalid()
}

module.exports = entry
