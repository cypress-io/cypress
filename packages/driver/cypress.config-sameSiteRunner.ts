// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

// Same-site runner spike: the run starts with the runner on a Cypress-reserved
// host under foobar.com, so a www.foobar.com AUT is same-site but cross-origin.
export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'http://cypress-runner.foobar.com:3500',
    specPattern: 'cypress/e2e/cy/isolated_runner*.cy.ts',
    experimentalRemoteDriver: true,
  },
  component: undefined,
})
