import { enumType, objectType } from 'nexus'

export const MIGRATION_STEPS = ['renameAuto', 'renameManual', 'configFile'] as const

const MigrationStepEnum = enumType({
  name: 'MigrationStepEnum',
  members: MIGRATION_STEPS,
})

export const Migration = objectType({
  name: 'Migration',
  description: 'The Wizard is a container for any state associated with initial onboarding to Cypress',
  definition (t) {
    t.nonNull.field('step', {
      type: MigrationStepEnum,
      description: 'Step where the migration is right now',
      resolve: () => 'renameManual',
    })

    t.nonNull.list.nonNull.string('specFilesBefore', {
      description: 'All spec files before being converted',
      resolve: () => {
        return [
          'cypress/integration/app_spec.js',
          'cypress/integration/blog-post-spec.js',
          'cypress/integration/homeSpec.js',
          'cypress/integration/company.js',
          'cypress/integration/sign-up.spec.js',
          'cypress/component/button.spec.js',
        ]
      },
    })

    t.nonNull.list.nonNull.string('specFilesAfter', {
      description: 'All spec files after conversion',
      resolve: () => {
        return [
          'cypress/e2e/app.cy.js',
          'cypress/e2e/blog-post.cy.js',
          'cypress/e2e/homeSpec.cy.js',
          'cypress/e2e/company.cy.js',
          'cypress/e2e/sign-up.cy.js',
          'cypress/component/button.cy.js',
        ]
      },
    })

    t.nonNull.list.nonNull.string('manualFiles', {
      description: 'List of files needing manual conversion',
      resolve: () => {
        return [
          'cypress/component/button.cy.js',
          'cypress/component/modal.cy.js',
          'cypress/component/toggle.cy.js',
          'cypress/component/alert.cy.js',
          'cypress/component/tooltip.cy.js',
        ]
      },
    })

    t.nonNull.string('configBeforeCode', {
      description: 'contents of the cypress.json file before conversion',
      resolve: () => {
        return `{
          "baseUrl": "http://localhost:1234/",
          "retries": 2
        }`
      },
    })

    t.nonNull.string('configAfterCode', {
      description: 'contents of the cypress.json file after conversion',
      resolve: () => {
        return `const { defineConfig } = require('cypress')

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
        })`
      },
    })
  },
})
