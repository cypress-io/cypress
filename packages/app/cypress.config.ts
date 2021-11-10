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
  'testFiles': '**/*.{spec,cy}.{js,ts,tsx,jsx}',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'integrationFolder': 'cypress/e2e/integration',
  'componentFolder': 'src',
  'supportFile': false,
  'component': {
    'testFiles': '**/*.{spec,cy}.{js,ts,tsx,jsx}',
    'supportFile': 'cypress/component/support/index.ts',
    'pluginsFile': 'cypress/component/plugins/index.js',
  },
  'e2e': {
    'pluginsFile': 'cypress/e2e/plugins/index.ts',
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      const { monorepoPaths } = require('../../scripts/gulp/monorepoPaths')
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(monorepoPaths.pkgApp, on, config)
    },
  },
})
