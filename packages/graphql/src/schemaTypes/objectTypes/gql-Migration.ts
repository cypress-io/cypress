import { objectType } from 'nexus'
import { MigrationStep, MigrationStepEnum } from './gql-MigrationStep'

// TODO: implement these values for migration using the ctx
export const Migration = objectType({
  name: 'Migration',
  description: 'Contains all data related to the 9.X to 10.0 migration UI',
  definition (t) {
    t.nonNull.field('step', {
      type: MigrationStepEnum,
      description: 'Step where the migration is right now',
      resolve: (source, args, ctx) => {
        return ctx.migration.step
      },
    })

    t.nonNull.list.nonNull.field('filteredSteps', {
      type: MigrationStep,
      description: 'Steps filtered with the current context',
      resolve: (source, args, ctx) => {
        return ctx.migration.filteredSteps.map((name) => {
          name
        })
      },
    })

    t.nonNull.list.nonNull.string('specFilesBefore', {
      description: 'All spec files before being converted',
      resolve: () => {
        return []
      },
    })

    t.nonNull.list.nonNull.string('specFilesAfter', {
      description: 'All spec files after conversion',
      resolve: () => {
        return []
      },
    })

    t.nonNull.list.nonNull.string('manualFiles', {
      description: 'List of files needing manual conversion',
      resolve: () => {
        return []
      },
    })

    t.nonNull.string('supportFileBefore', {
      description: 'Support files needing automated rename',
      resolve: () => {
        return 'cypress/support/index.js'
      },
    })

    t.nonNull.string('supportFileAfter', {
      description: 'Support files after rename',
      resolve: () => {
        return 'cypress/support/e2e.js'
      },
    })

    t.nonNull.string('configBeforeCode', {
      description: 'contents of the cypress.json file before conversion',
      resolve: (source, args, ctx) => {
        return ctx.migration.getConfig()
      },
    })

    t.nonNull.string('configAfterCode', {
      description: 'contents of the cypress.json file after conversion',
      resolve: (source, args, ctx) => {
        return ctx.migration.createConfigString()
      },
    })

    t.nonNull.string('integrationFolder', {
      description: 'the integration folder path used to store e2e tests',
      resolve: (source, args, ctx) => {
        return ctx.migration.getIntegrationFolder()
      },
    })

    t.nonNull.string('componentFolder', {
      description: 'the component folder path used to store components tests',
      resolve: (source, args, ctx) => {
        return ctx.migration.getComponentFolder()
      },
    })
  },
})
