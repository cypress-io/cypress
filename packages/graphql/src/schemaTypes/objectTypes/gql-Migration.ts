import { objectType } from 'nexus'
import { MigrationStep, TestingTypeEnum } from '..'
import Debug from 'debug'

const debug = Debug('cypress:graphql:gql-Migration')

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
    t.nonNull.list.nonNull.field('filteredSteps', {
      type: MigrationStep,
      description: 'Steps filtered with the current context',
      resolve: (source, args, ctx) => {
        return ctx.migration.filteredSteps.map((name) => {
          return {
            name,
          }
        })
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

    t.nonNull.list.nonNull.field('manualFiles', {
      description: 'List of files needing manual conversion',
      type: MigrationFile,
      resolve: () => {
        return []
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
