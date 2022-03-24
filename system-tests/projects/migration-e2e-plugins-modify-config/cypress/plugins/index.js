module.exports = (on, config) => {
  config.integrationFolder = 'tests/e2e'
  config.testFiles = '**/*.spec.js'
  // In the plugin @cypress/code-coverage this pattern is used
  config.env.CYPRESS_RECORD_KEY_DRAGGING = 'true'

  return config
}
