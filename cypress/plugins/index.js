const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const babelConfig = require('../../babel.config.js')

/** @type import("webpack").Configuration */
const webpackOptions = {
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx'],
    alias: {
      react: path.resolve('./node_modules/react'),
    },
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
        options: babelConfig,
      },
      {
        test: /\.modules\.css$/i,
        exclude: [/node_modules/],
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/, /\.modules\.css$/i],
        use: ['style-loader', 'css-loader'],
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
    ],
  },
}

const options = {
  // send in the options from your webpack.config.js, so it works the same
  // as your app's code
  webpackOptions,
  watchOptions: {},
}

module.exports = (on, config) => {
  on('file:preprocessor', webpackPreprocessor(options))
  return config
}
