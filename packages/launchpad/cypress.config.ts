import { defineConfig } from 'cypress'
import getenv from 'getenv'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : 'sehy69',
  'viewportWidth': 800,
  'viewportHeight': 850,
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'testFiles': '**/*.spec.{js,ts,tsx,jsx}',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'componentFolder': 'src',
  'component': {
    'testFiles': '**/*.spec.{js,ts,tsx,jsx}',
    'supportFile': 'cypress/component/support/index.ts',
    'pluginsFile': 'cypress/component/plugins/index.js',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({
        options: cypressConfig,
        ...devServerConfig,
      })
    },
    devServerConfig: {
      viteConfig: {
        optimizeDeps: {
          include: [
            '@packages/ui-components/cypress/support/customPercyCommand',
          ],
        },
      },
    },
  },
  'e2e': {
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
    'integrationFolder': 'cypress/e2e/integration',
    'pluginsFile': 'cypress/e2e/plugins/index.ts',
    async setupNodeEvents (on, config) {
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(on, config)
    },
  },
})
