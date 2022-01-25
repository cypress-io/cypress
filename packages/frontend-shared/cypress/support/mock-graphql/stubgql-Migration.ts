import { MIGRATION_STEPS } from '@packages/types'
import type { Migration } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

export const stubMigration: MaybeResolver<Migration> = {
  __typename: 'Migration',
  filteredSteps: MIGRATION_STEPS.map((name, index) => {
    return {
      id: (index + 1).toString(),
      index: index + 1,
      isCompleted: false,
      isCurrentStep: name === 'renameAuto',
      __typename: 'MigrationStep',
      name,
    }
  }),
  specFiles: {
    __typename: 'MigrationFiles',
    before: [
      {
        __typename: 'MigrationFile',
        parts: [
          { __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationFilePart', text: 'integration', highlight: true },
          { __typename: 'MigrationFilePart', text: '/app', highlight: false },
          { __typename: 'MigrationFilePart', text: '.spec.', highlight: true },
          { __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
      {
        __typename: 'MigrationFile',
        parts: [
          { __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationFilePart', text: 'integration', highlight: true },
          { __typename: 'MigrationFilePart', text: '/blog-post', highlight: false },
          { __typename: 'MigrationFilePart', text: '-spec.', highlight: true },
          { __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
    ],
    after: [
      {
        __typename: 'MigrationFile',
        parts: [
          { __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationFilePart', text: 'e2e', highlight: true },
          { __typename: 'MigrationFilePart', text: '/app', highlight: false },
          { __typename: 'MigrationFilePart', text: '.cy.', highlight: true },
          { __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
      {
        __typename: 'MigrationFile',
        parts: [
          { __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { __typename: 'MigrationFilePart', text: 'e2e', highlight: true },
          { __typename: 'MigrationFilePart', text: '/blog-post', highlight: false },
          { __typename: 'MigrationFilePart', text: '.cy.', highlight: true },
          { __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
        testingType: 'e2e',
      },
    ],
  },
  manualFiles: {
    __typename: 'ManualMigration',
    completed: false,
    files: [
      {
        __typename: 'ManualMigrationFile',
        moved: false,
        relative: 'cypress/component/button-spec.js',
      },
      {
        __typename: 'ManualMigrationFile',
        moved: true,
        relative: 'cypress/component/hello.spec.tsx',
      },
    ],
  },
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
  supportFiles: {
    __typename: 'MigrationFiles',
    before: [
      {
        __typename: 'MigrationFile',
        testingType: 'e2e',
        parts: [
          {
            __typename: 'MigrationFilePart',
            text: 'cypress/support/',
            highlight: false,
          },
          {
            __typename: 'MigrationFilePart',
            text: 'index',
            highlight: true,
          },
          {
            __typename: 'MigrationFilePart',
            text: '.js',
            highlight: false,
          },
        ],
      },
    ],
    after: [
      {
        __typename: 'MigrationFile',
        testingType: 'e2e',
        parts: [
          {
            __typename: 'MigrationFilePart',
            text: 'cypress/support/',
            highlight: false,
          },
          {
            __typename: 'MigrationFilePart',
            text: 'e2e',
            highlight: true,
          },
          {
            __typename: 'MigrationFilePart',
            text: '.js',
            highlight: false,
          },
        ],
      },
    ],
  },
  hasComponentTesting: true,
  hasCustomComponentFolder: false,
  hasCustomComponentSpecPattern: false,
  hasCustomIntegrationFolder: false,
  hasCustomIntegrationSpecPattern: false,
}
