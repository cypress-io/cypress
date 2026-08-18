// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    // The network-affected specs: everything that observes request/response
    // handling, since that is all `forceHttp1` changes.
    specPattern: '{cypress/e2e/commands/{cookies,navigation,net_stubbing,request,waiting}.cy.{js,ts},cypress/e2e/cypress/{downloads,network_utils,proxy-logging}.cy.{js,ts},cypress/e2e/e2e/{csp_headers,e2e_cookies,encoding,redirects,security,service-worker}.cy.{js,ts}}',
    forceHttp1: true,
  },
  component: undefined,
})
