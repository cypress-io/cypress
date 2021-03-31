const webpackPreprocessor = require('../../../../../../npm/webpack-preprocessor')

module.exports = (on) => {
  console.log('plugin ran')
  on('file:preprocessor', webpackPreprocessor())
}
