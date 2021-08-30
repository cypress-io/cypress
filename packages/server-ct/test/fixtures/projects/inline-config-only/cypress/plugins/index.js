const { startDevServer } = require('@cypress/webpack-dev-server')

module.exports = (on, config) => {
  on('dev-server:start', (options) => {
    return startDevServer({
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
      options,
    })
  })

  return {
    ...config,
    componentFolder: 'cypress/custom-folder',
    testFiles: '**/*.spec.js',
    video: false
  }
}
