// @ts-check
const { startDevServer } = require('@cypress/webpack-dev-server')
const path = require('path')
const babelConfig = require('../../babel.config.js')

/** @type import("webpack").Configuration */
const webpackConfig = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.scss', '.css'],
  },
  mode: 'development',
  devtool: false,
  output: {
    publicPath: '/',
    chunkFilename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        options: { ...babelConfig, cacheDirectory: path.resolve(__dirname, '..', '..', '.babel-cache') },
      },
      {
        test: /\.modules?\.s[ac]ss$/i,
        exclude: [/node_modules/],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          'sass-loader',
        ],
      },
      {
        test: /\.s[ac]ss$/i,
        exclude: [/node_modules/, /\.modules?\.s[ac]ss$/i],
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        // some of our examples import SVG
        test: /\.svg$/,
        loader: 'svg-url-loader',
      },
      {
        // some of our examples import SVG
        test: /\.svg$/,
        loader: 'svg-url-loader',
      },
      {
        test: /\.(png|jpg)$/,
        use: ['file-loader'],
      },
      {
        test: /\.(svg|eot|woff|woff2|ttf)$/,
        use: ['file-loader'],
      },
    ],
  },
}

/**
 * @type Cypress.PluginConfig
 */
module.exports = (on, config) => {
  on('dev-server:start', (options) => startDevServer({ options, webpackConfig, disableLazyCompilation: false }))

  return config
}
