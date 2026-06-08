import { defineConfig } from 'cypress'

// import.meta.resolve must be present within an ESM context
import.meta.resolve

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    supportFile: false,
    setupNodeEvents: async (_, config: Cypress.PluginConfigOptions) => {
      await import('find-up')

      return config
    },
  },
})
