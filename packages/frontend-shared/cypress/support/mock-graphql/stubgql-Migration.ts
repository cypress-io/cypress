import { MIGRATION_STEPS } from '@packages/types'
import type { Migration } from '../generated/test-graphql-types.gen'
import type { MaybeResolver } from './clientTestUtils'

let _id = 0

const id = () => {
  _id++

  return _id.toString()
}

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
  specFiles: [
    {
      __typename: 'MigrationFile',
      testingType: 'e2e',
      before: {
        __typename: 'MigrationFileData',
        id: id(),
        relative: 'cypress/integration/app.spec.js',
        parts: [
          { id: id(), __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { id: id(), __typename: 'MigrationFilePart', text: 'integration', highlight: true },
          { id: id(), __typename: 'MigrationFilePart', text: '/app', highlight: false },
          { id: id(), __typename: 'MigrationFilePart', text: '.spec.', highlight: true },
          { id: id(), __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
      },
      after: {
        __typename: 'MigrationFileData',
        id: id(),
        relative: 'cypress/integration/app.spec.js',
        parts: [
          { id: id(), __typename: 'MigrationFilePart', text: 'cypress/', highlight: false },
          { id: id(), __typename: 'MigrationFilePart', text: 'integration', highlight: true },
          { id: id(), __typename: 'MigrationFilePart', text: '/app', highlight: false },
          { id: id(), __typename: 'MigrationFilePart', text: '.cy.', highlight: true },
          { id: id(), __typename: 'MigrationFilePart', text: 'js', highlight: false },
        ],
      },
    },
  ],
  manualFiles: {
    id: id(),
    __typename: 'ManualMigration',
    completed: false,
    files: [
      {
        id: id(),
        __typename: 'ManualMigrationFile',
        moved: false,
        relative: 'cypress/component/button-spec.js',
      },
      {
        id: id(),
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
  supportFiles:
    {
      __typename: 'MigrationFile',
      testingType: 'e2e',
      before: {
        id: id(),
        relative: 'cypress/support/index.js',
        __typename: 'MigrationFileData',
        parts: [
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: 'cypress/support/',
            highlight: false,
          },
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: 'index',
            highlight: true,
          },
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: '.js',
            highlight: false,
          },
        ],
      },
      after: {
        id: id(),
        relative: 'cypress/support/e2e.js',
        __typename: 'MigrationFileData',
        parts: [
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: 'cypress/support/',
            highlight: false,
          },
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: 'e2e',
            highlight: true,
          },
          {
            id: id(),
            __typename: 'MigrationFilePart',
            text: '.js',
            highlight: false,
          },
        ],
      },
    },
  hasComponentTesting: true,
  hasCustomComponentFolder: false,
  hasCustomComponentTestFiles: false,
  hasCustomIntegrationFolder: false,
  hasCustomIntegrationTestFiles: false,
  configFileNameAfter: 'cypress.config.js',
  configFileNameBefore: 'cypress.json',
  shouldMigratePreExtension: true,
}
