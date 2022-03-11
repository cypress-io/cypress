module.exports = (on, config) => {
  config.integrationFolder = 'tests/e2e'
  config.testFiles = '**/*.spec.js'

  return config
}
