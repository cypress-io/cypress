const cp = require('child_process')
const { startDevServer } = require('@cypress/webpack-dev-server')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const webpackConfig = require('../../webpack.config').default

module.exports = (on, config) => {
  cp.exec('http-server -p 5005 dist')

  if (config.testingType === 'component') {
    on('dev-server:start', (options) => {
      return startDevServer({ options, webpackConfig })
    })
  } else {
    on('file:preprocessor', webpackPreprocessor())
  }

  return config
}
