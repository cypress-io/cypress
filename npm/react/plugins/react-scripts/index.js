const filePreprocessor = require('../cra-v3/file-preprocessor')

module.exports = (on, config, options) => {
  require('@cypress/code-coverage/task')(on, config)
  on('file:preprocessor', filePreprocessor(config, options))

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
