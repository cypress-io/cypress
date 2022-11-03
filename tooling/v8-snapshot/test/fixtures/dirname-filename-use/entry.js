const valid = require('./valid-module')
const dirname = require('./using-dirname-delayed')
const filename = require('./using-filename-init')

function entry() {
  return valid() + dirname() + filename
}

module.exports = entry
