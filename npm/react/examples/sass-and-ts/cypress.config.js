const { defineConfig } = require('cypress')

// @ts-check

// load Webpack file devServer that comes with this plugin
// https://github.com/bahmutov/cypress-react-unit-test#install
const { devServer, defineDevServerConfig } = require('@cypress/react/plugins/load-webpack')

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
