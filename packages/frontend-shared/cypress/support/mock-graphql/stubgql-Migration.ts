import type { Migration } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

export const stubMigration: MaybeResolver<Migration> = {
  __typename: 'Migration',
  step: `renameManual`,

  specFilesBefore: [
    'cypress/integration/app_spec.js',
    'cypress/integration/blog-post-spec.js',
    'cypress/integration/homeSpec.js',
    'cypress/integration/company.js',
    'cypress/integration/sign-up.spec.js',
    'cypress/component/button.spec.js',
  ],
  specFilesAfter: [
    'cypress/e2e/app.cy.js',
    'cypress/e2e/blog-post.cy.js',
    'cypress/e2e/homeSpec.cy.js',
    'cypress/e2e/company.cy.js',
    'cypress/e2e/sign-up.cy.js',
    'cypress/component/button.cy.js',
  ],
  manualFiles: [
    'cypress/component/button.cy.js',
    'cypress/component/modal.cy.js',
    'cypress/component/toggle.cy.js',
    'cypress/component/alert.cy.js',
    'cypress/component/tooltip.cy.js',
  ],
  configBeforeCode: `{
    "baseUrl": "http://localhost:1234/",
    "retries": 2
  }`,
  configAfterCode: `const { defineConfig } = require('cypress')

  module.exports = defineConfig({
    retries: 2,
    e2e: {
      // End-to-end config overrides go here
      baseUrl: "http://localhost:1234/"
  
      setupNodeEvents (on, config) {
        // We've imported your old cypress plugins here.
        // You may want to clean this up later by importing these directly
        return require('cypress/plugins/index.js')(on, config) }
      }
    },
  })`,
}
