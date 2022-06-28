import { defineConfig } from 'cypress'
import getenv from 'getenv'
import { snapshotCypressDirectory } from './cypress/tasks/snapshotsScaffold'
import { uninstallDependenciesInScaffoldedProject } from './cypress/tasks/uninstallDependenciesInScaffoldedProject'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')
const CYPRESS_INTERNAL_DEV_PROJECT_ID = getenv('CYPRESS_INTERNAL_DEV_PROJECT_ID', process.env.CYPRESS_INTERNAL_DEV_PROJECT_ID || 'sehy69')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : CYPRESS_INTERNAL_DEV_PROJECT_ID,
  viewportWidth: 800,
  viewportHeight: 850,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
    videoCompression: false, // turn off video compression for CI
  },
  component: {
    supportFile: 'cypress/component/support/index.ts',
    devServer: {
      bundler: 'vite',
      framework: 'vue',
      viteConfig: {
        optimizeDeps: {
          include: [
            '@packages/ui-components/cypress/support/customPercyCommand',
          ],
        },
      },
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
  e2e: {
    baseUrl: 'http://localhost:5555',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      on('task', {
        snapshotCypressDirectory,
        uninstallDependenciesInScaffoldedProject,
      })

      return await e2ePluginSetup(on, config)
    },
  },
})
