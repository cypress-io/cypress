// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

// Same-site runner spike: the runner is served from cypress-runner.foobar.com,
// so the www.foobar.com app is same-site but cross-origin to it.
export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    baseUrl: 'http://www.foobar.com:3500',
    specPattern: 'cypress/e2e/cy/isolated_runner*.cy.ts',
    experimentalRemoteDriver: true,
  },
  component: undefined,
})
