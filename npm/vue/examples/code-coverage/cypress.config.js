const { defineConfig } = require('cypress')

/// <reference types="cypress" />
const { startDevServer } = require('@cypress/webpack-dev-server')

const webpackConfig = require('../../webpack.config')

module.exports = defineConfig({
  componentFolder: 'src',
  fixturesFolder: false,
  testFiles: '**/*.spec.js',
  video: false,

  e2e: {
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
