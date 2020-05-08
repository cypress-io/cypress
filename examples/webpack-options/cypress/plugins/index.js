// @ts-check
const webpackPreprocessor = require('@cypress/webpack-preprocessor')
module.exports = (on, config) => {
  on(
    'file:preprocessor',
    // @ts-ignore
    webpackPreprocessor(webpackPreprocessor.defaultOptions),
  )
}
