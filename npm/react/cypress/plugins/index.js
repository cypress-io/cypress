// const webpackPreprocessor = require('@cypress/webpack-preprocessor')
const babelConfig = require('../../babel.config.js')

/// <reference types="cypress" />
// const webpackDevServer = require('../../dist/plugins/webpack')
//
// module.exports = (on, config) => {
//   webpackDevServer(on, config, () => require('../../webpack.config'))
//
//   return config
// }

const { startDevServer } = require('@cypress/webpack-dev-server')

/**
 * Registers Cypress preprocessor for Vue component testing.
 * IMPORTANT to return the config object with
 * with the any changed environment variables.
 *
 * @param {Cypress.PluginConfigOptions} config Cypress config object.
 * @example
 *  // in your project's plugins/index.js file
 *  const preprocessor = require('@cypress/vue/dist/plugins/webpack')
 *  module.exports = (on, config) => {
 *    preprocessor(on, config)
 *    // IMPORTANT return the config object
 *    return config
 *  }
 */

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

const cypressPluginsFn = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)
  on('dev-server:start', (options) => startDevServer(options, webpackConfig))

  return config
}

module.exports = cypressPluginsFn
