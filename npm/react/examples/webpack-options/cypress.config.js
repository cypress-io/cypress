const { devServer } = require('@cypress/webpack-dev-server')

module.exports = {
  'video': false,
  'fixturesFolder': false,
  'viewportWidth': 500,
  'viewportHeight': 500,
  'component': {
    devServer (cypressDevServerConfig) {
      const path = require('path')
      const babelConfig = require('./babel.config')

      /** @type import("webpack").Configuration */
      const webpackConfig = {
        resolve: {
          extensions: ['.js', '.ts', '.jsx', '.tsx'],
        },
        mode: 'development',
        devtool: false,
        output: {
          publicPath: '/',
          chunkFilename: '[name].bundle.js',
        },
        // TODO: update with valid configuration for your components
        module: {
          rules: [
            {
              test: /\.(js|jsx|mjs|ts|tsx)$/,
              loader: 'babel-loader',
              options: { ...babelConfig, cacheDirectory: path.resolve(__dirname, '.babel-cache') },
            },
          ],
        },
      }

      process.env.BABEL_ENV = 'test' // this is required to load commonjs babel plugin

      return devServer(cypressDevServerConfig, { webpackConfig })
    },
  },
}
