// default webpack file preprocessor is good for simple cases
const { onFileDefaultPreprocessor } = require('../../preprocessor/webpack')

module.exports = (on, config) => {
  require('@cypress/code-coverage/task')(on, config)
  on('file:preprocessor', onFileDefaultPreprocessor(config))

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
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
