// default webpack file preprocessor is good for simple cases
const { onFileDefaultPreprocessor } = require('../../preprocessor/webpack')

module.exports = on => {
  on('file:preprocessor', onFileDefaultPreprocessor)
}

/*
  for more complex cases, when the project already includes webpack.config.js

  const {
    onFilePreprocessor
  } = require('cypress-vue-unit-test/preprocessor/webpack')
  module.exports = on => {
    on('file:preprocessor', onFilePreprocessor('../path/to/webpack.config'))
  }
*/
