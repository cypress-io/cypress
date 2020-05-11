const wp = require('@cypress/webpack-preprocessor')

const webpackOptions = {
  devtool: 'inline-source-map',
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.[jt]s$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              'plugins': ['@babel/plugin-transform-typescript'],
              'presets': ['@babel/preset-env'],
            },
          },
        ],
      },
    ],
  },
}

module.exports = (on) => {
  on('file:preprocessor', wp({ webpackOptions }))
}
