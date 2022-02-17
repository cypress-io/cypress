const { defineConfig } = require('cypress')

// @ts-check
const path = require('path')
const babelConfig = require('./babel.config')

module.exports = defineConfig({
  video: false,
  fixturesFolder: false,
  testFiles: '**/*cy-spec.js',
  viewportWidth: 500,
  viewportHeight: 500,
  e2e: {
    setupNodeEvents (on, config) {
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

      process.env.BABEL_ENV = 'test' // this is required to load commonjs babel plugin

      on('dev-server:start', (options) => {
        return startDevServer({
          options,
          webpackConfig,
        })
      })

      // if adding code coverage, important to return updated config
      return config
    },
  },
})
