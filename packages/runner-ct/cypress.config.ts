import { defineConfig } from 'cypress'

export default defineConfig({
  testFiles: '**/*spec.{ts,tsx}',
  video: true,
  env: {
    reactDevtools: false,
  },
  reporter: '../../node_modules/cypress-multi-reporters/index.js',
  reporterOptions: {
    configFile: '../../mocha-reporter-config.json',
  },
  component: {
    testFiles: '**/*spec.{ts,tsx}',
  },
})
