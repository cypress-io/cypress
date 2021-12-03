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
  'reporter': '../../node_modules/cypress-multi-reporters/index.js',
  'reporterOptions': {
    'configFile': '../../mocha-reporter-config.json',
  },
  'component': {
    'specPattern': 'src/**/*.spec.{js,ts,tsx,jsx}',
    devServer (cypressConfig) {
      const { startDevServer } = require('@cypress/vite-dev-server')

      return startDevServer({
        options: cypressConfig,
        viteConfig: require('./vite.config'),
      })
    },
  },
  'e2e': {
    'supportFile': 'cypress/e2e/support/e2eSupport.ts',
    'specPattern': 'cypress/integration/**/*.spec.{js,ts,tsx,jsx}',
  },
})
