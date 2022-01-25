import { MIGRATION_STEPS } from '@packages/types'
import { enumType, objectType } from 'nexus'
import { TestingTypeEnum } from '..'
import Debug from 'debug'

const debug = Debug('cypress:graphql:gql-Migration')

export const MigrationStepEnum = enumType({
  name: 'MigrationStepEnum',
  members: MIGRATION_STEPS,
})

export const MigrationFilePart = objectType({
  name: 'MigrationFilePart',
  definition (t) {
    t.nonNull.string('text', {
      description: 'part of filename',
    })

    t.nonNull.boolean('highlight', {
      description: 'should highlight in migration UI',
    })
  },
})

export const MigrationFiles = objectType({
  name: 'MigrationFiles',
  definition (t) {
    t.nonNull.list.nonNull.field('before', {
      type: MigrationFile,
    })

    t.nonNull.list.nonNull.field('after', {
      type: MigrationFile,
    })
  },
})

export const ManualMigrationFile = objectType({
  name: 'ManualMigrationFile',
  definition (t) {
    t.nonNull.boolean('moved', {
      description: 'has the file been moved since opening the migration helper',
    })

    t.nonNull.string('relative', {
      description: 'name of file to migrate',
    })
  },
})

export const ManualMigration = objectType({
  name: 'ManualMigration',
  definition (t) {
    t.nonNull.list.nonNull.field('files', {
      type: ManualMigrationFile,
      description: 'files needing manual migration',
    })

    t.nonNull.boolean('completed', {
      description: 'is the manual migration completed (all files are moved)',
    })
  },
})

export const MigrationFile = objectType({
  name: 'MigrationFile',
  definition (t) {
    t.nonNull.list.nonNull.field('parts', {
      type: MigrationFilePart,
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

    t.nonNull.field('specFiles', {
      description: 'All spec files after conversion',
      type: MigrationFiles,
      resolve: async (source, args, ctx) => {
        const result = await ctx.migration.getSpecsForMigrationGuide()

        debug('got migration specs %o', result)

        return result
      },
    })

    t.field('manualFiles', {
      description: 'List of files needing manual conversion',
      type: ManualMigration,
      resolve: async (source, args, ctx) => {
        const status = await ctx.migration.getComponentTestingMigrationStatus()

        return {
          completed: status.completed,
          // we sort it to make sure the endpoint always returns the
          // specs in the same order, so things don't jump around.
          files: [...status.files.values()]
          .sort((x, y) => y.relative.length - x.relative.length),
        }
      },
    })

    t.nonNull.field('supportFiles', {
      description: 'Support files needing automated rename',
      type: MigrationFiles,
      resolve: (source, args, ctx) => {
        return ctx.migration.supportFilesForMigrationGuide()
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
