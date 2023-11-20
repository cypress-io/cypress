const valid = require('./valid-module')
const invalid1 = require('./invoke-not-function')
const invalid2 = require('./invoke-undefined')
const invalid3 = require('./invoke-push-on-undefined')

function entry() {
  return valid() + invalid1() + invalid2() + invalid3()
}

module.exports = entry
