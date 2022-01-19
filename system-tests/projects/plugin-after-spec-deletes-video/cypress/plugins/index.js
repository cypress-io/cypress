const fs = require('fs-extra')

module.exports = (on) => {
  on('after:spec', (spec, results) => {
    return fs.remove(results.video)
  })
}
