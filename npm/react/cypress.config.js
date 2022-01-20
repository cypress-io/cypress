// @ts-check

module.exports = {
  'viewportWidth': 400,
  'viewportHeight': 400,
  'video': false,
  'projectId': 'z9dxah',
  'env': {
    'reactDevtools': true,
  },
  'ignoreSpecPattern': [
    '**/__snapshots__/*',
    '**/__image_snapshots__/*',
  ],
  'experimentalFetchPolyfill': true,
  'component': {
    ignoreSpecPattern: 'examples/**/*',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/webpack-dev-server')
      const path = require('path')
      const babelConfig = require('./babel.config.js')

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
              options: { ...babelConfig, cacheDirectory: path.resolve(__dirname, '..', '..', '.babel-cache') },
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

      return startDevServer({ options: cypressConfig, disableLazyCompilation: false, webpackConfig })
    },
  },
}
