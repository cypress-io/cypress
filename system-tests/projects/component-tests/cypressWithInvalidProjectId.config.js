const { defineConfig } = require('cypress')

module.exports = defineConfig({
  projectId: 'abcdef42',
  e2e: {
    specPattern: 'cypress/e2e/**/*',
  },
  component: {
    specPattern: 'cypress/component-tests/**/*',
    devServer: {
      bundler: 'webpack',
    },
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
