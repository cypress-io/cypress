// https://github.com/cypress-io/cypress-webpack-preprocessor
const webpackPreprocessor = require('@cypress/webpack-preprocessor')

// Cypress webpack options or just require from
// an existing webpack.config.js
const webpackOptions = {
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      }
    ]
  }
}

const options = {
  webpackOptions
}

module.exports = on => {
  on('file:preprocessor', webpackPreprocessor(options))
}
