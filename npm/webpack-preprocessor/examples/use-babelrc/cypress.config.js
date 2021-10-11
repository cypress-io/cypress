const { defineConfig } = require('cypress')

const webpackPreprocessor = require('../..')
const defaults = webpackPreprocessor.defaultOptions

module.exports = defineConfig({
  fixturesFolder: false,
  supportFile: false,
  e2e: {
    setupNodeEvents (on, config) {
      delete defaults.webpackOptions.module.rules[0].use[0].options.presets
      on('file:preprocessor', webpackPreprocessor(defaults))
    }
  }
})
