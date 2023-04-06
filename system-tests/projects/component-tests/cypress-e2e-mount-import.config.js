const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    supportFile: 'cypress/support/e2e-with-mount.js',
  },
  component: {
    specPattern: 'cypress/component-tests/*.spec.js',
    devServer: {
      bundler: 'webpack',
    },
  },
})
