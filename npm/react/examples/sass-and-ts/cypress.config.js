const { defineConfig } = require('cypress')

// @ts-check

// load Webpack file devServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const devServer = require('@cypress/react/plugins/load-webpack')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  testFiles: '**/*spec.*',
  viewportWidth: 500,
  viewportHeight: 500,
  componentFolder: 'src',
  nodeVersion: 'system',
  env: {
    coverage: true,
  },
  component: {
    setupNodeEvents (on, config) {
      devServer(on, config, {
        webpackFilename: 'webpack.config.js',
      })

      // IMPORTANT to return the config object
      // with the any changed environment variables
      return config
    },
  },
})
