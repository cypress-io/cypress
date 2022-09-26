import { defineConfig } from 'cypress'
import getenv from 'getenv'

export default defineConfig({
  projectId: getenv('CYPRESS_INTERNAL_DEV_PROJECT_ID', process.env.CYPRESS_INTERNAL_DEV_PROJECT_ID || 'ypt4pf'),
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
  },
  e2e: {
    baseUrl: 'http://localhost:5555',
    supportFile: 'cypress/e2e/support/e2eSupport.ts',
  },
})
