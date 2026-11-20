// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig, EXPERIMENTAL_DRIVER_SPECS } from './cypress.config'

// run with CYPRESS_INTERNAL_EXPERIMENTAL_DRIVER=1 (`yarn cypress:run:experimental-driver`), which turns the experimental driver on

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: [...EXPERIMENTAL_DRIVER_SPECS, 'cypress/e2e/cy/experimental_driver.cy.ts'],
  },
  component: undefined,
})
