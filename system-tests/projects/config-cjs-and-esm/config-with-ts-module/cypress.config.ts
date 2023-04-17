import { defineConfig } from 'cypress'

export default defineConfig({
  videoCompression: false, // turn off video compression for CI
  e2e: {
    supportFile: false,
    setupNodeEvents: async (_, config) => {
      await import('find-up')

      return config
    },
  },
})
