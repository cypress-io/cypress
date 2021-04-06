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
        '**',
        '*'
      )
    )
  },

  getPathToPlugins() {
    return path.resolve(__dirname, '..', 'cypress', 'plugins', 'index.js')
  },

  getPathToSupportFiles() {
    return glob(
      path.join(
        __dirname,
        '..',
        'cypress',
        'support',
        '**',
        '*'
      )
    )
  },

  getPathToTsConfig() {
    return path.resolve(__dirname, '..', 'cypress', 'tsconfig.json')
  },

  getPathToFixture() {
    return path.resolve(__dirname, '..', 'cypress', 'fixtures', 'example.json')
  }
}
