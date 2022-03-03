import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'

import getenv from 'getenv'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : 'sehy69',
  viewportWidth: 302,
  viewportHeight: 850,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
    videoCompression: false, // turn off video compression for CI
  },
  'component': {
    devServer,
    devServerConfig: {
      optimizeDeps: {
        include: [
          '@packages/ui-components/cypress/support/customPercyCommand',
        ],
      },
    },
  },
  'e2e': {
    baseUrl: 'http://localhost:5555',
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
  },
})
