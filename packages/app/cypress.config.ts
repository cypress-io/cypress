import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'
import getenv from 'getenv'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : 'sehy69',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  experimentalInteractiveRunEvents: true,
  component: {
    viewportWidth: 800,
    viewportHeight: 850,
    supportFile: 'cypress/component/support/index.ts',
    specPattern: 'src/**/*.{spec,cy}.{js,ts,tsx,jsx}',
    devServer,
    devServerConfig: {
      optimizeDeps: {
        include: [
          '@headlessui/vue',
          'vue3-file-selector',
          'just-my-luck',
          'combine-properties',
          'faker',
          '@packages/ui-components/cypress/support/customPercyCommand',
        ],
      },
    },
  },
  'e2e': {
    baseUrl: 'http://localhost:5555',
    pluginsFile: 'cypress/e2e/plugins/index.ts',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      // Delete this as we only want to honor it on parent Cypress when doing E2E Cypress in Cypress testing
      delete process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      // process.env.DEBUG = '*'
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(on, config)
    },
  },
  // @ts-ignore We are setting these namespaces in order to properly test Cypress in Cypress
  clientRoute: '/__app/',
  namespace: '__cypress-app',
  socketIoRoute: '/__app-socket.io',
  socketIoCookie: '__app-socket.io',
  devServerPublicPathRoute: '/__cypress-app/src',
})
