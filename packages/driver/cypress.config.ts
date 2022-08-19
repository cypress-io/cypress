import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'ypt4pf',
  // @ts-ignore - https://github.com/cypress-io/cypress/issues/23338
  'experimentalStudio': true,
  'hosts': {
    '*.foobar.com': '127.0.0.1',
    '*.idp.com': '127.0.0.1',
    'localalias': '127.0.0.1',
  },
  'reporter': 'cypress-multi-reporters',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'e2e': {
    'setupNodeEvents': (on, config) => {
      return require('./cypress/plugins')(on, config)
    },
    'baseUrl': 'http://localhost:3500',
  },
})
