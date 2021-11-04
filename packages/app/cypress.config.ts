import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'sehy69',
  'viewportWidth': 800,
  'viewportHeight': 850,
  'fixturesFolder': false,
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'nodeVersion': 'system',
  'testFiles': '**/*.spec.{j,ts,tsx,jsx}',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'integrationFolder': 'cypress/e2e/integration',
  'componentFolder': 'src',
  'supportFile': false,
  'component': {
    'testFiles': '**/*.spec.{js,ts,tsx,jsx}',
    'supportFile': 'cypress/component/support/index.ts',
    'pluginsFile': 'cypress/component/plugins/index.js',
  },
  'e2e': {
    'pluginsFile': 'cypress/e2e/plugins/index.ts',
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
  },
})
