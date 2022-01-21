import type { Migration } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'
import { regexps } from '@packages/data-context/src/util/migration'

export const stubMigration: MaybeResolver<Migration> = {
  __typename: 'Migration',
  step: `renameManual`,
  regexps: {
    __typename: 'MigrationRegexp',
    beforeE2E: regexps.e2e.beforeRegexp,
    afterE2E: regexps.e2e.afterRegexp,
    beforeComponent: regexps.component.beforeRegexp,
    afterComponent: regexps.component.afterRegexp,
  },
  specFilesBefore: [
    {
      __typename: 'MigrationSpec',
      parts: [
        { __typename: 'MigrationSpecPart', text: 'cypress/', highlight: false },
        { __typename: 'MigrationSpecPart', text: 'integration', highlight: true },
        { __typename: 'MigrationSpecPart', text: '/app', highlight: false },
        { __typename: 'MigrationSpecPart', text: '.spec.', highlight: true },
        { __typename: 'MigrationSpecPart', text: 'js', highlight: false },
      ],
      testingType: 'e2e',
    },
    {
      __typename: 'MigrationSpec',
      parts: [
        { __typename: 'MigrationSpecPart', text: 'cypress/', highlight: false },
        { __typename: 'MigrationSpecPart', text: 'integration', highlight: true },
        { __typename: 'MigrationSpecPart', text: '/blog-post', highlight: false },
        { __typename: 'MigrationSpecPart', text: '-spec.', highlight: true },
        { __typename: 'MigrationSpecPart', text: 'js', highlight: false },
      ],
      testingType: 'e2e',
    },
  ],
  specFiles: {
    __typename: 'MigrationSpecs',
    after: [
      {
        __typename: 'MigrationSpec',
        parts: [
          { __typename: 'MigrationSpecPart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationSpecPart', text: 'e2e', highlight: true },
          { __typename: 'MigrationSpecPart', text: '/app', highlight: false },
          { __typename: 'MigrationSpecPart', text: '.cy.', highlight: true },
          { __typename: 'MigrationSpecPart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
    ],
    before: [
      {
        __typename: 'MigrationSpec',
        parts: [
          { __typename: 'MigrationSpecPart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationSpecPart', text: 'e2e', highlight: true },
          { __typename: 'MigrationSpecPart', text: '/blog-post', highlight: false },
          { __typename: 'MigrationSpecPart', text: '.cy.', highlight: true },
          { __typename: 'MigrationSpecPart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
    ],
  },
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
  integrationFolder: 'cypress/integration',
  componentFolder: 'cypress/component',
}
