module.exports = {
  'projectId': 'ypt4pf',
  'baseUrl': 'http://localhost:3500',
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    'setupNodeEvents': require('./cypress/plugins'),
  },
}
