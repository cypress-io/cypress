// @ts-check
const { defineConfig } = require('cypress')
const { devServer }  = require('@cypress/webpack-dev-server')

const path = require('path')
const babelConfig = require('./babel.config')

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
        test: /.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',

        options: {
          ...babelConfig,
          cacheDirectory: path.resolve(__dirname, '.babel-cache'),
        },
      },
    ],
  },
}

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  viewportWidth: 500,
  viewportHeight: 500,
  component: {
    devServer,
    devServerConfig: defineDevServerConfig({ webpackConfig }),
    testFiles: '**/*cy-spec.js',
    setupNodeEvents (on, config) {
      process.env.BABEL_ENV = 'test' // this is required to load commonjs babel plugin

      // if adding code coverage, important to return updated config
      return config
    },
  },
})
