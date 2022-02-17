const { defineConfig } = require('cypress')
const { devServer } = require('@cypress/webpack-dev-server')

const webpackConfig = require('./webpack.config')

module.exports = defineConfig({
  fixturesFolder: false,
  video: false,
  component: {
    devServer,
    devServerConfig: webpackConfig,
    componentFolder: 'src',
    specPattern: '**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents (on, config) {
      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
