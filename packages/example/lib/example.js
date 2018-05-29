const path = require('path')
const glob = require('glob')

module.exports = {
  getPathToExamples () {
    return glob.sync(
      path.join(
        __dirname,
        '..',
        'cypress',
        'integration',
        'examples',
        '**',
        '*'
      )
    )
  },

  getFolderName () {
    return 'examples'
  },
}
