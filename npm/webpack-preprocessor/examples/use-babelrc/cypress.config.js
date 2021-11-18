module.exports = {
  'fixturesFolder': false,
  'supportFile': false,
  'e2e': {
    setupNodeEvents (on, config) {
      const webpackPreprocessor = require('../..')
      const defaults = webpackPreprocessor.defaultOptions

      delete defaults.webpackOptions.module.rules[0].use[0].options.presets
      on('file:preprocessor', webpackPreprocessor(defaults))

      return config
    },
  },
}
