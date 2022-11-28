import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents: async (_, config) => {
      await import('find-up')

      return config
    },
  },
})
