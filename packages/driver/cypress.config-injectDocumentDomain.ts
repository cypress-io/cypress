// tslint:disable-next-line: no-implicit-dependencies - cypress
import { defineConfig } from 'cypress'
import { baseConfig } from './cypress.config'

export default defineConfig({
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: '{cypress/**/origin/**/*.cy.{js,ts},cypress/**/cookies.cy.{js,ts},cypress/**/net_stubbing.cy.{js,ts}}',
    // SPIKE(#34869): run the origin suite without document.domain so WebKit exercises cy.origin on Linux CI
    injectDocumentDomain: false,
  },
  component: undefined,
})
