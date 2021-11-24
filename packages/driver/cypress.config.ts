import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'ypt4pf',
  'hosts': {
    '*.foobar.com': '127.0.0.1',
  },
  'baseUrl': 'http://localhost:3500',
  'reporter': 'cypress-multi-reporters',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    'testFiles': '**/*',
    'setupNodeEvents': require('./cypress/plugins'),
  },
})
