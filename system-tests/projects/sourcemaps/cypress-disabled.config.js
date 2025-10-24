const path = require('path')
const os = require('os')

module.exports = {
  e2e: {
    supportFile: false,
    setupNodeEvents (on, config) {
      require('./cypress-preprocessor-disabled.config.js')(on, config)
    },
  },
  env: {
    areSourceMapsAvailable: false,
    sourceMapProjectRoot: path.join(os.tmpdir(), 'cy-projects/sourcemaps'),
  },
}
