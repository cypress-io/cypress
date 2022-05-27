// NOTE: ensure you are requiring your webpack config from the
// correct location.
const webpackConfig = require('./webpack.config.js')

module.exports = {
  component: {
    devServer: {
      bundler: 'webpack',
      webpackConfig,
    },
  },
}
