// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

// Isolated-runner spike: no baseUrl, so the runner is served from Cypress's own
// origin, and the remote driver keeps the top frame there for every cy.visit.
export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: null,
    specPattern: 'cypress/e2e/cy/isolated_runner*.cy.ts',
    experimentalRemoteDriver: true,
  },
  component: undefined,
})
