const { defineConfig } = require('cypress')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    specPattern: '**/*cy-spec.js',
    setupNodeEvents (on, config) {
      require('@cypress/react/plugins/load-webpack')(on, config, {
        // from the root of the project (folder with cypress.json file)
        webpackFilename: 'webpack.config.js',
      })

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
