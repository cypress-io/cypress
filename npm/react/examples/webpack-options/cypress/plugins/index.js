// @ts-check
const path = require('path')
const { startDevServer } = require('@cypress/webpack-dev-server')
const babelConfig = require('../../babel.config')

// Cypress Webpack preprocessor includes Babel env preset,
// but to transpile JSX code we need to add Babel React preset
module.exports = (on, config) => {
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
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig }))

  // if adding code coverage, important to return updated config
  return config
}
