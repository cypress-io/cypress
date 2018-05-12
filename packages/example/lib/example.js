const glob = require('glob')
const path = require('path')

module.exports = {
  getPathToExamples () {
    return glob.sync(path.join(__dirname, '..', 'cypress', 'integration', 'examples', '**', '*'))
  },

  getFolderName () {
    return 'examples'
  },
}
