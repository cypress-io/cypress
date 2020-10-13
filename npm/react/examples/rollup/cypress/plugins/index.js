const rollupPreprocessor = require('@bahmutov/cy-rollup')

module.exports = (on, config) => {
  on(
    'file:preprocessor',
    rollupPreprocessor({
      configFile: 'rollup.config.js',
    }),
  )

  require('@cypress/code-coverage/task')(on, config)
  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config
}
