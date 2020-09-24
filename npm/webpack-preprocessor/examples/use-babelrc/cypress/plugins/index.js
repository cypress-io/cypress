const webpackPreprocessor = require('../../../..')
const defaults = webpackPreprocessor.defaultOptions

module.exports = (on) => {
  delete defaults.webpackOptions.module.rules[0].use[0].options.presets
  on('file:preprocessor', webpackPreprocessor(defaults))
}
