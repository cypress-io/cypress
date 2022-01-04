import { defineConfig } from 'cypress'
import getenv from 'getenv'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : 'sehy69',
  baseUrl: 'http://localhost:5555',
  viewportWidth: 800,
  viewportHeight: 850,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'component': {
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
  },
})
