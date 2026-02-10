import { defineConfig } from 'cypress'

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
