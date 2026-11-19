// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

// Isolated-runner spike: a localhost baseUrl serves the runner from Cypress's own
// origin, so every AUT is cross-origin to it. Run with CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER=1.
export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'http://localhost:3500',
    specPattern: 'cypress/e2e/cy/isolated_runner*.cy.ts',
  },
  component: undefined,
})
