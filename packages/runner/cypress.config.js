module.exports = {
  'projectId': 'ypt4pf',
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    'baseUrl': 'http://localhost:3500',
    'setupNodeEvents': require('./cypress/plugins'),
  },
}
