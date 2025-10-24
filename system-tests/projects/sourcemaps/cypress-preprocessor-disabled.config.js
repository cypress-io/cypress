const webpack = require('@cypress/webpack-preprocessor')

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      devtool: false, // This disables sourcemaps
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
