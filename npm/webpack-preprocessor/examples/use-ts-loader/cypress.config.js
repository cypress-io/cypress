const { defineConfig } = require('cypress')

const webpackPreprocessor = require('../..')

module.exports = defineConfig({
  "fixturesFolder": false,
  "supportFile": false,
  e2e: {
    setupNodeEvents(on, config) {
      const webpack = require('./webpack.config.js')

      on('file:preprocessor', webpackPreprocessor({ webpack }))
    }
  }
})
