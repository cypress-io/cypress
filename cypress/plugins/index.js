const path = require('path')
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const babelConfig = require('../../babel.config.js')
// const { initPlugin } = require('cypress-plugin-snapshots/plugin')

// should we just reuse root webpack config?
const webpackOptions = {
  resolve: {
    alias: {
      react: path.resolve('./node_modules/react'),
    },
  },
  mode: 'development',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.(js|jsx|mjs|ts|tsx)$/,
        loader: 'babel-loader',
        options: babelConfig,
      },
      {
        test: /\.css$/,
        exclude: [/node_modules/],
        use: ['style-loader', 'css-loader'],
      },
      {
        // some of our examples import SVG
        test: /\.svg$/,
        loader: 'svg-url-loader',
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

  // initPlugin(on, config)
  return config
}
