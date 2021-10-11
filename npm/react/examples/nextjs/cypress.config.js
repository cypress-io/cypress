const { defineConfig } = require('cypress')

const devServer = require('@cypress/react/plugins/next')

module.exports = defineConfig({
  video: false,
  testFiles: '**/*.spec.{js,jsx}',
  viewportWidth: 500,
  viewportHeight: 800,
  experimentalFetchPolyfill: true,
  componentFolder: 'cypress/components',
  env: {
    coverage: true,
  },
  component: {
    setupNodeEvents (on, config) {
      devServer(on, config)

      return config
    },
  },
})
