const path = require('path')
const Promise = require('bluebird')
const glob = Promise.promisify(require('glob'))

const pathToExamples = path.join(
  __dirname,
  '..',
  'cypress',
  'integration',
  '**',
  '*'
)

module.exports = {
  getPathToExamples () {
    return glob(pathToExamples, { nodir: true })
  },

  getPathToExampleFolders () {
    return glob(`${pathToExamples}${path.sep}`)
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
