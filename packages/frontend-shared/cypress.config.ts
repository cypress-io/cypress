import { defineConfig } from 'cypress'

export default defineConfig({
  'projectId': 'sehy69',
  'baseUrl': 'http://localhost:5555',
  'viewportWidth': 800,
  'viewportHeight': 850,
  'retries': {
    'runMode': 2,
    'openMode': 0,
  },
  'nodeVersion': 'system',
  'testFiles': '**/*.spec.{js,ts,tsx,jsx}',
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'componentFolder': 'src',
  'component': {
    'testFiles': '**/*.spec.{js,ts,tsx,jsx}',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({
        options: cypressConfig,
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
      })
    },
  },
  'e2e': {
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
  },
})
