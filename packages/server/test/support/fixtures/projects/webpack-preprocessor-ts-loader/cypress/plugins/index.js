const wp = require('@cypress/webpack-preprocessor')

const webpackOptions = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
}

module.exports = (on) => {
  on('file:preprocessor', wp({ webpackOptions }))
}
