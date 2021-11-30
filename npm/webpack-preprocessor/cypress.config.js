module.exports = {
  'integrationFolder': 'cypress/tests',
  'e2e': {
    setupNodeEvents (on, config) {
      const webpackPreprocessor = require('./index')

      on('file:preprocessor', webpackPreprocessor())

      return config
    },
  },
}
