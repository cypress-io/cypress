const { defineConfig } = require('cypress')

module.exports = defineConfig({
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    devServer: require('@cypress/react/plugins/load-webpack'),
    devServerConfig: {
      // from the root of the project (folder with cypress.config.{ts|js} file)
      webpackFilename: 'webpack.config.js',
    },
  },
})
