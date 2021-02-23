const filePreprocessor = require('./file-preprocessor')

module.exports = (on, config) => {
  on('file:preprocessor', filePreprocessor(config))

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
