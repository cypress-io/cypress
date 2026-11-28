import { defineConfig } from 'cypress'

const baseUrl: string = 'http://localhost:3000'
const viewport = { viewportWidth: 1280, viewportHeight: 720 } as const

export default defineConfig({
  e2e: {
    baseUrl,
    ...viewport,
    setupNodeEvents (on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions) {
      return config
    },
  },
})
