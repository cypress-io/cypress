const path = require('path')
const Promise = require('bluebird')
const glob = Promise.promisify(require('glob'))

const pathToExamples = path.join(
  __dirname,
  '..',
  'cypress',
  'e2e',
  '**',
  '*'
)

module.exports = {
  getPathToExamples () {
    return glob(pathToExamples, { nodir: true })
  },

  getPathToE2E() {
    return path.join(__dirname, '..', 'cypress', 'e2e')
  },

  getPathToExampleFolders () {
    return glob(`${pathToExamples}${path.sep}`)
  },

  getPathToPlugins() {
    return path.resolve(__dirname, '..', 'cypress', 'plugins', 'index.js')
  },

  getPathToTsConfig() {
    return path.resolve(__dirname, '..', 'cypress', 'tsconfig.json')
  },

  getPathToFixture() {
    return path.resolve(__dirname, '..', 'cypress', 'fixtures', 'example.json')
  }
}
