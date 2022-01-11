import { defineConfig } from 'cypress'
import { devServer } from '@cypress/vite-dev-server'
import getenv from 'getenv'

const CYPRESS_INTERNAL_CLOUD_ENV = getenv('CYPRESS_INTERNAL_CLOUD_ENV', process.env.CYPRESS_INTERNAL_ENV || 'development')

export default defineConfig({
  projectId: CYPRESS_INTERNAL_CLOUD_ENV === 'staging' ? 'ypt4pf' : 'sehy69',
  viewportWidth: 800,
  viewportHeight: 850,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  // @ts-expect-error
  clientRoute: '/cy-parent-client/',
  namespace: 'cy-parent-namespace',
  socketIoRoute: '/cy-parent-socket',
  socketIoCookie: 'cy-parent-socket',
  devServerPublicPathRoute: '/cy-parent-namespace/src',
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  experimentalInteractiveRunEvents: true,
  component: {
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
    pluginsFile: 'cypress/e2e/plugins/index.ts',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      delete process.env.HTTP_PROXY_TARGET_HOST
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(on, config)
    },
  },
})
