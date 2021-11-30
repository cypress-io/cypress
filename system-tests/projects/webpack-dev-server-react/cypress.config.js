module.exports = {
  testFiles: 'src/**/*.spec.{js,jsx}',
  componentFolder: 'src',
  component: {
    componentFolder: 'src',
    testFiles: 'src/**/*.spec.{js,jsx}',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')

      return startDevServer({
        webpackConfig: require('./webpack.config.js'),
        options: cypressConfig,
      })
    },
  },
}
