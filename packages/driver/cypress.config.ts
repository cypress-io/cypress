import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'ypt4pf',
  'baseUrl': 'http://localhost:3500',
  'testFiles': '**/*',
  'reporter': 'cypress-multi-reporters',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
})
