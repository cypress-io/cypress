// @ts-check
const { defineConfig } = require('cypress')

// load the devServer & defineDevServerConfig functions that come with this plugin
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer }  = require('@cypress/react/plugins/load-webpack')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  nodeVersion: 'system',
  env: {
    coverage: true,
  },
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({
      webpackFilename: 'webpack.config.js',
    }),
    componentFolder: 'src',
    testFiles: '**/*spec.*',
  },
})
