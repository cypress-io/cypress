module.exports = (on, config) => {
  config.integrationFolder = 'tests/e2e'
  config.testFiles = '**/*.spec.js'

  // test that browsers is an array
  config.browsers.length

  // test that retries is an object
  config.retries.runMode = 1

  // test component is an object
  config.component.testFiles = '**/*.spec.ts'

  // test e2e is an object
  config.e2e.testFiles = '**/*.js'

  // test clientCertificates is an array
  config.clientCertificates.length

  return config
}
