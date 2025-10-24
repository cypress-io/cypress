const webpack = require('@cypress/webpack-preprocessor')
const path = require('path')

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      context: path.resolve(__dirname, 'cypress'),
      devtool: 'inline-source-map', // This disables sourcemaps
      resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx'],
      },
      module: {
        rules: [
          {
            test: /\.ts$/,
            exclude: [/node_modules/],
            use: [
              {
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                },
              },
            ],
          },
        ],
      },
    },
    watchOptions: {},
  }

  on('file:preprocessor', webpack(options))
}
