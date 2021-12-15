import { MIGRATION_STEPS } from '@packages/types'
import { enumType, objectType } from 'nexus'

export const MigrationStepEnum = enumType({
  name: 'MigrationStepEnum',
  members: MIGRATION_STEPS,
})

// TODO: implement these values for migration using the ctx
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

    t.nonNull.string('configBeforeCode', {
      description: 'contents of the cypress.json file before conversion',
      resolve: () => {
        return ``
      },
    })

    t.nonNull.string('configAfterCode', {
      description: 'contents of the cypress.json file after conversion',
      resolve: () => {
        return ``
      },
    })
  },
})
