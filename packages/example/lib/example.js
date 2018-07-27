const path = require('path')
const Promise = require('bluebird')
const glob = Promise.promisify(require('glob'))

module.exports = {
  getPathToExamples () {
    return glob(
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
