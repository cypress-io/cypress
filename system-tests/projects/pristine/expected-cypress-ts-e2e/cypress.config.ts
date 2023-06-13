import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  e2e: {
    setupNodeEvents (on, config) {
      // implement node event listeners here
    },
  },
})
