import { defineConfig } from 'cypress'
import { initGitRepoForTestProject, resetGitRepoForTestProject } from './cypress/tasks/git'
import { writeMochaEventSnapshot, readMochaEventSnapshot } from './cypress/tasks/mochaEvents'
import { setupCyInCyVariables } from '@packages/frontend-shared/cypress/tasks/cy-in-cy-variables'

export default defineConfig({
  /**
   * NOTE: currently using Cypress.env() in the test config, so we need to set allowCypressEnv to true
   * @percy/cypress: https://github.com/percy/percy-cypress/blob/master/index.js#L13
   */
  allowCypressEnv: true,
  projectId: 'ypt4pf',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  experimentalMemoryManagement: true,
  experimentalCspAllowList: false,
  experimentalInteractiveRunEvents: true,
  experimentalRunAllSpecs: true,
  component: {
    experimentalSingleTabRunMode: true,
    viewportWidth: 800,
    viewportHeight: 850,
    supportFile: 'cypress/component/support/index.ts',
    specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
  },
  hosts: {
    'foobar.com': '127.0.0.1',
  },
  e2e: {
    experimentalOriginDependencies: true,
    baseUrl: 'http://localhost:5555',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    numTestsKeptInMemory: 1,
    async setupNodeEvents (on, config) {
      if (!process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS) {
        throw new Error('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS is missing. Close Cypress and run tests using the `yarn cypress:*` commands from the `packages/app` directory')
      }

      // Delete this as we only want to honor it on parent Cypress when doing E2E Cypress in Cypress testing
      delete process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS
      delete process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF_PARENT_PROJECT
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      config.expose.INTERNAL_E2E_TESTING_SELF = 'true'
      process.env.CYPRESS_INTERNAL_VITE_OPEN_MODE_TESTING = 'true'

      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      const { setCyInCyVariables, getCyInCyVariables } = setupCyInCyVariables()

      on('task', {
        initGitRepoForTestProject,
        resetGitRepoForTestProject,
        writeMochaEventSnapshot,
        readMochaEventSnapshot,
        setCyInCyVariables,
        getCyInCyVariables,
      })

      return await e2ePluginSetup(on, config)
    },
  },
  // @ts-ignore We are setting these namespaces in order to properly test Cypress in Cypress
  clientRoute: '/__app/',
  namespace: '__cypress-app',
  socketIoRoute: '/__app-socket',
  socketIoCookie: '__app-socket',
  devServerPublicPathRoute: '/__cypress-app/src',
})
