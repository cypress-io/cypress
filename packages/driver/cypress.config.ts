import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'ypt4pf',
  'baseUrl': 'http://localhost:3500',
  'testFiles': '**/*',
  'hosts': {
    '*.foobar.com': '127.0.0.1',
  },
  'reporter': 'cypress-multi-reporters',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
})
