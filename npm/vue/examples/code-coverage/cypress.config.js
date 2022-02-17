const { defineConfig } = require('cypress')

/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackConfig = require('../../webpack.config')

module.exports = defineConfig({
  fixturesFolder: false,
  video: false,
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({ webpackConfig }),
    componentFolder: 'src',
    testFiles: '**/*.spec.js',
    setupNodeEvents (on, config) {
      on('dev-server:start', (options) => {
        return startDevServer({
          options,
          webpackConfig,
        })
      })

      require('@cypress/code-coverage/task')(on, config)

      return config
    },
  },
})
