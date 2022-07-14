import { defineConfig } from 'cypress'
// load the environment variables from the local .env file
import dotenv from 'dotenv'

dotenv.config()

export default defineConfig({
  projectId: 'ypt4pf',
  e2e: {
    defaultCommandTimeout: 20000, // these take a bit longer b/c they're e2e open mode test
    async setupNodeEvents (on, config) {
      if (!process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS) {
        throw new Error('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS is missing. This env is require for cypress-in-cypress testing.')
      }

      // Delete this as we only want to honor it on parent Cypress when doing E2E Cypress in Cypress testing
      delete process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup') as typeof import('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(on, config)
    },
  },
  retries: {
    runMode: 2,
  },
  // @ts-ignore We are setting these namespaces in order to properly test Cypress in Cypress
  clientRoute: '/__app/',
  namespace: '__cypress-app',
  socketIoRoute: '/__app-socket',
  socketIoCookie: '__app-socket',
  devServerPublicPathRoute: '/__cypress-app/src',
})
