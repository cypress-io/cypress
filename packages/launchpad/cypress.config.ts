import { defineConfig } from 'cypress'
import { snapshotCypressDirectory } from './cypress/tasks/snapshotsScaffold'
import { uninstallDependenciesInScaffoldedProject } from './cypress/tasks/uninstallDependenciesInScaffoldedProject'

export default defineConfig({
  projectId: 'ypt4pf',
  viewportWidth: 800,
  viewportHeight: 850,
  experimentalMemoryManagement: true,
  retries: {
    runMode: 10,
    openMode: 0,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  component: {
    experimentalSingleTabRunMode: true,
    supportFile: 'cypress/component/support/index.ts',
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
    indexHtmlFile: 'cypress/component/support/component-index.html',
  },
  e2e: {
    baseUrl: 'http://localhost:5555',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT
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
