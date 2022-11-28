const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    specPattern: 'cypress/tests/**/*',
    setupNodeEvents (on, config) {
      const webpackPreprocessor = require('./index')

      on('file:preprocessor', webpackPreprocessor())

      return config
    },
  },
})
