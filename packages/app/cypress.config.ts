import { defineConfig } from 'cypress'
import { initGitRepoForTestProject, resetGitRepoForTestProject } from './cypress/tasks/git'

export default defineConfig({
  projectId: 'ypt4pf',
  retries: {
    runMode: 2,
    openMode: 0,
  },
  videoCompression: false, // turn off video compression for CI
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  experimentalInteractiveRunEvents: true,
  component: {
    viewportWidth: 800,
    viewportHeight: 850,
    supportFile: 'cypress/component/support/index.ts',
    specPattern: 'src/**/*.{spec,cy}.{js,jsx,ts,tsx}',
    devServer: {
      bundler: 'vite',
      framework: 'vue',
      viteConfig: {
        optimizeDeps: {
          include: [
            '@headlessui/vue',
            'vue3-file-selector',
            'p-defer',
            'just-my-luck',
            'combine-properties',
            'faker',
            '@packages/frontend-shared/cypress/support/customPercyCommand',
          ],
        },
      },
    },
  },
  'e2e': {
    experimentalStudio: true,
    baseUrl: 'http://localhost:5555',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      if (!process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS) {
        throw new Error('HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS is missing. Close Cypress and run tests using the `yarn cypress:*` commands from the `packages/app` directory')
      }

      // Delete this as we only want to honor it on parent Cypress when doing E2E Cypress in Cypress testing
      delete process.env.HTTP_PROXY_TARGET_FOR_ORIGIN_REQUESTS
      process.env.CYPRESS_INTERNAL_E2E_TESTING_SELF = 'true'
      process.env.CYPRESS_INTERNAL_VITE_OPEN_MODE_TESTING = 'true'
      // process.env.DEBUG = '*'
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      on('task', {
        initGitRepoForTestProject,
        resetGitRepoForTestProject,
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
