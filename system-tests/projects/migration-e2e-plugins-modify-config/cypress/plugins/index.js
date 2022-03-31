module.exports = (on, config) => {
  config.integrationFolder = 'tests/e2e'
  config.testFiles = '**/*.spec.js'
  // In the plugin @cypress/code-coverage this pattern is used
  config.env.codeCoverageRegistered = 'true'

  // test that browsers is an array
  if (!config.browsers.length) {
    // test that retries is an object
    config.retries.runMode = 1
  }

  // test component is an object
  config.component.testFiles = '**/*.spec.js'

  // test e2e is an object
  config.e2e.testFiles = '**/*.ts'

  // test clientCertificates is an array
  config.clientCertificates.length

  return config
}
