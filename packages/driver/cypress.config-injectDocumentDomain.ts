// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: '{cypress/**/origin/**/*.cy.{js,ts},cypress/**/cookies.cy.js,cypress/**/net_stubbing.cy.js}',
    injectDocumentDomain: true,
  },
  component: undefined,
})
