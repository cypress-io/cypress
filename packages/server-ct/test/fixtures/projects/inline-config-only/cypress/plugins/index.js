const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      webpackConfig: {
        output: {
          publicPath: '/',
        },
        devServer: {
          publicPath: '/',
        },
      },
      options,
    })
  })

  return {
    ...config,
    componentFolder: 'cypress/components',
    testFiles: 'cypress/**/*.spec.js'
  }
}
