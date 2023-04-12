import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  viewportWidth: 1111,
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents (on, config) {
      return require('./cypress/plugins/index.ts').default(on, config)
    },
  },
})
