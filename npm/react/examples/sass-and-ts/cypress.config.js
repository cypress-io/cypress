// @ts-check
const { defineConfig } = require('cypress')

// load the devServer function that comes with this plugin
// https://github.com/cypress-io/cypress/tree/master/npm/react#install
const { devServer }  = require('@cypress/react/plugins/load-webpack')

const webpackConfig = require('webpack.config.js')

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
    devServerConfig: webpackConfig,
    componentFolder: 'src',
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
  },
})
