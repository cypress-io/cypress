import { defineConfig } from 'cypress'

export default defineConfig({
  allowCypressEnv: false,
  e2e: {
    experimentalRunAllSpecs: true,
    supportFile: false,
    specPattern: '**/*.cy.ts',
  },
})
