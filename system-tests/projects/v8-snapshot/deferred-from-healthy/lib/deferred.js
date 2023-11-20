const fs = require('fs')

function accessfs () {
  return fs.readFileSync(__filename)
}

module.exports = accessfs()
