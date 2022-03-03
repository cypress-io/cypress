import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'ypt4pf',
  viewportHeight: 1001,
  viewportWidth: 1000,
  'hosts': {
    '*.foobar.com': '127.0.0.1',
  },
  'reporter': 'cypress-multi-reporters',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    'setupNodeEvents': require('./cypress/plugins'),
    'baseUrl': 'http://localhost:3500',
  },
})
