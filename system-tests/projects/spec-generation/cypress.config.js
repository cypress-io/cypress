const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'componentFolder': 'src',
  'component': {
    'supportFile': false,
    devServer,
    devServerConfig: {
      webpackConfig: {
        output: {
          publicPath: '/',
        },
      },
    },
  },
}
