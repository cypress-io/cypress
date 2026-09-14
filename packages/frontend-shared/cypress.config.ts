// tslint:disable-next-line: no-implicit-dependencies - requires cypress
import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'ypt4pf',
  viewportWidth: 800,
  viewportHeight: 850,
  retries: {
    runMode: 2,
    openMode: 0,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  component: {
    experimentalSingleTabRunMode: true,
    devServer: {
      bundler: 'vite',
      framework: 'vue',
    },
  },
  e2e: {
    baseUrl: 'http://localhost:5555',
  },
})
