const path = require('path')
const os = require('os')

module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      require('./cypress-preprocessor-enabled-updated-sourcemap-root.config.js')(on, config)
    },
  },
  env: {
    areSourceMapsAvailable: true,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps/cypress'),
  },
}
