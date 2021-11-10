module.exports = {
  'baseUrl': 'http://localhost:5005',
  'projectId': 'ypt4pf',
  'viewportWidth': 800,
  'viewportHeight': 850,
  'env': {
    'webpackFilename': 'webpack.config.ts',
    'coverage': false,
  },
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'nodeVersion': 'system',
  'testFiles': '**/*_spec.{js,jsx}',
  'componentFolder': 'src',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    setupNodeEvents (on, config) {
      const express = require('express')

      express().use(express.static('dist')).listen(5005)

      const webpackPreprocessor = require('@cypress/webpack-preprocessor')

      on('file:preprocessor', webpackPreprocessor())

      return config
    },
  },
  'component': {
    setupNodeEvents (on, config) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      const webpackConfig = require('./webpack.config').default

      on('dev-server:start', (options) => {
        return startDevServer({ options, webpackConfig })
      })

      return config
    },
  },
}
