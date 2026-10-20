import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    experimentalRunAllSpecs: true,
    supportFile: false,
    specPattern: '**/*.cy.ts',
  },
})
