const express = require('express')
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const webpackConfig = require('../../webpack.config').default

express().use(express.static('dist')).listen(5555)

module.exports = (on, config) => {
  if (config.testingType === 'component') {
    on('dev-server:start', (options) => {
      return startDevServer({ options, webpackConfig })
    })
  } else {
    on('file:preprocessor', webpackPreprocessor())
  }

  return config
}
