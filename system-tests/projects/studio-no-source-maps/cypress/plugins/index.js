const webpackPreprocessor = require('@cypress/webpack-preprocessor')

module.exports = (on) => {
  const options = {
    webpackOptions: {
      devtool: false,
    },
  }

  on('file:preprocessor', webpackPreprocessor(options))
}
