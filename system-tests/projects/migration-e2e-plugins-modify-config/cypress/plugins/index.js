module.exports = (on, config) => {
  console.log('Hello, world!')
  config.integrationFolder = 'tests/e2e'
  config.testFiles = '**/*.spec.js'

  return config
}
