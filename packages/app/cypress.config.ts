import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'sehy69',
  'viewportWidth': 800,
  'viewportHeight': 850,
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'nodeVersion': 'system',
  'testFiles': '**/*.{specl,cyl}.{js,ts,tsx,jsx}',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'integrationFolder': 'cypress/e2e/integration',
  'componentFolder': 'src',
  'supportFile': false,
  'component': {
    'testFiles': '**/*.{specl,cyl}.{js,ts,tsx,jsx}',
    'supportFile': 'cypress/component/support/index.ts',
    devServer (cypressConfig, devServerConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({ options: cypressConfig, ...devServerConfig })
    },
    devServerConfig: {
      viteConfig: {
        // TODO(tim): Figure out why this isn't being picked up
        optimizeDeps: {
          include: [
            '@headlessui/vue',
            'vue3-file-selector',
            'just-my-luck',
            'combine-properties',
            'faker',
          ],
        },
      },
    },
  },
  'e2e': {
    'pluginsFile': 'cypress/e2e/plugins/index.ts',
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
    async setupNodeEvents (on, config) {
      const { monorepoPaths } = require('../../scripts/gulp/monorepoPaths')
      const { e2ePluginSetup } = require('@packages/frontend-shared/cypress/e2e/e2ePluginSetup')

      return await e2ePluginSetup(monorepoPaths.pkgApp, on, config)
    },
  },
})
