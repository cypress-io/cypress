const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/react/plugins/load-webpack')

module.exports = defineConfig({
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    devServer,
    devServerConfig: {
      // from the root of the project (folder with cypress.config.{ts|js} file)
      webpackFilename: 'webpack.config.js',
    },
  },
})
