import { defineConfig } from 'cypress'

const webpackPreprocessor = require('../..')

export default defineConfig({
  fixturesFolder: false,
  supportFile: false,
  e2e: {
    setupNodeEvents(on, config) {
      const webpack = require('./webpack.config.js')

      on('file:preprocessor', webpackPreprocessor({ webpack }))
    }
  }
})
