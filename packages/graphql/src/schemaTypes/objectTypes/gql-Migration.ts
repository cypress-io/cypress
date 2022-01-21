import { MIGRATION_STEPS } from '@packages/types'
import { enumType, objectType } from 'nexus'
import { TestingTypeEnum } from '..'
import { regexps } from '@packages/data-context/src/util/migration'
import Debug from 'debug'

const debug = Debug('cypress:graphql:gql-Migration')

export const MigrationStepEnum = enumType({
  name: 'MigrationStepEnum',
  members: MIGRATION_STEPS,
})

export const MigrationSpecPart = objectType({
  name: 'MigrationSpecPart',
  definition (t) {
    t.nonNull.string('text', {
      description: 'part of filename',
    })

    t.nonNull.boolean('highlight', {
      description: 'should highlight in migration UI',
    })
  },
})

export const MigrationSpecs = objectType({
  name: 'MigrationSpecs',
  definition (t) {
    t.nonNull.list.nonNull.field('before', {
      type: MigrationSpec,
    })

    t.nonNull.list.nonNull.field('after', {
      type: MigrationSpec,
    })
  },
})

export const MigrationSpec = objectType({
  name: 'MigrationSpec',
  definition (t) {
    t.nonNull.list.nonNull.field('parts', {
      type: MigrationSpecPart,
    })

    t.nonNull.field('testingType', {
      type: TestingTypeEnum,
    })
  },
})

export const MigrationRegexp = objectType({
  name: 'MigrationRegexp',
  definition (t) {
    t.nonNull.string('beforeE2E', {
      description: 'regexp to identify existing specs in e2e',
    })

    t.nonNull.string('afterE2E', {
      description: 'regexp to use to rename existing specs in e2e',
    })

    t.nonNull.string('beforeComponent', {
      description: 'regexp to identiey existing specs in component',
    })

    t.nonNull.string('afterComponent', {
      description: 'regexp to use to rename existing specs in component',
    })
  },
})

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

    t.nonNull.field('regexps', {
      type: MigrationRegexp,
      description: 'The regexp describing how the user e2e specs changed',
      resolve: () => {
        return {
          beforeE2E: regexps.e2e.beforeRegexp,
          afterE2E: regexps.e2e.afterRegexp,
          beforeComponent: regexps.component.beforeRegexp,
          afterComponent: regexps.component.beforeRegexp,
        }
      },
    })

    t.nonNull.list.nonNull.field('specFilesBefore', {
      type: MigrationSpec,
      description: 'All spec files before being converted',
      resolve: () => {
        return [
        ]
      },
    })

    t.nonNull.field('specFiles', {
      description: 'All spec files after conversion',
      type: MigrationSpecs,
      resolve: async (source, args, ctx) => {
        const result = await ctx.migration.getSpecsForMigrationGuide()

        debug('got migration specs %o', result)

        return result
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
