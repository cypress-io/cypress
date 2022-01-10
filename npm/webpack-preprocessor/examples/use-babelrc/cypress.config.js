module.exports = {
  'fixturesFolder': false,
  'e2e': {
<<<<<<< HEAD
=======
    'supportFile': false,
    'specPattern': 'cypress/integration/**/*',
>>>>>>> origin/10.0-release
    setupNodeEvents (on, config) {
      const webpackPreprocessor = require('../..')
      const defaults = webpackPreprocessor.defaultOptions

      delete defaults.webpackOptions.module.rules[0].use[0].options.presets
      on('file:preprocessor', webpackPreprocessor(defaults))

      return config
    },
  },
}
