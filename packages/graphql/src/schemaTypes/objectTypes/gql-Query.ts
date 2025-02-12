import { idArg, stringArg, nonNull, objectType } from 'nexus'
import { ProjectLike } from '../interfaceTypes/gql-ProjectLike'
import { ScaffoldedFile } from './gql-ScaffoldedFile'
import { CurrentProject } from './gql-CurrentProject'
import { DevState } from './gql-DevState'
import { AuthState } from './gql-AuthState'
import { LocalSettings } from './gql-LocalSettings'
import { Migration } from './gql-Migration'
import { VersionData } from './gql-VersionData'
import { Wizard } from './gql-Wizard'
import { ErrorWrapper } from './gql-ErrorWrapper'
import { CachedUser } from './gql-CachedUser'
import { Cohort } from './gql-Cohorts'
import { Studio } from './gql-Studio'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.field('baseError', {
      type: ErrorWrapper,
      resolve: (root, args, ctx) => ctx.coreData.diagnostics.error,
    })

    t.field('cachedUser', {
      type: CachedUser,
      resolve: (root, args, ctx) => ctx.coreData.user,
    })

    t.nonNull.list.nonNull.field('warnings', {
      type: ErrorWrapper,
      description: 'A list of warnings',
      resolve: (source, args, ctx) => {
        return ctx.coreData.diagnostics.warnings
      },
    })

    t.nonNull.field('wizard', {
      type: Wizard,
      description: 'Metadata about the wizard',
      resolve: (root, args, ctx) => ctx.coreData.wizard,
    })

    t.field('migration', {
      type: Migration,
      description: 'Metadata about the migration, null if we aren\'t showing it',
      resolve: async (root, args, ctx) => {
        // First check to see if "legacyConfigForMigration" is defined as that means we have started migration
        if (ctx.coreData.migration.legacyConfigForMigration) return ctx.coreData.migration.legacyConfigForMigration

        if (!ctx.migration.needsCypressJsonMigration()) {
          return null
        }

        await ctx.lifecycleManager.legacyMigration()

        return ctx.coreData.migration.legacyConfigForMigration
      },
    })

    t.nonNull.field('dev', {
      type: DevState,
      description: 'The state of any info related to local development of the runner',
      resolve: (root, args, ctx) => ctx.coreData.dev,
    })

    t.field('versions', {
      deferIfNotLoaded: true,
      type: VersionData,
      description: 'Previous versions of cypress and their release date',
      resolve: (root, args, ctx) => {
        return ctx.versions.versionData()
      },
    })

    t.field('currentProject', {
      type: CurrentProject,
      description: 'The currently opened project',
      resolve: (root, args, ctx) => {
        if (ctx.coreData.currentProject) {
          return ctx.lifecycleManager
        }

        return null
      },
    })

    t.nonNull.list.nonNull.field('projects', {
      type: ProjectLike,
      description: 'All known projects for the app',
      resolve: (root, args, ctx) => ctx.coreData.app.projects,
    })

    t.nonNull.boolean('isGlobalMode', {
      description: 'Whether the app is in global mode or not. This is based off the presence of a project, which is set by the CLI (or absent if the app is run directly). See cli/lib/exec/open.js for the logic that sets the project or not.',
      resolve: (source, args, ctx) => !ctx.modeOptions.project,
    })

    t.nonNull.field('authState', {
      type: AuthState,
      description: 'The latest state of the auth process',
      resolve: (source, args, ctx) => ctx.coreData.authState,
    })

    t.field('studio', {
      type: Studio,
      description: 'Data pertaining to studio and the studio manager that is loaded from the cloud',
      resolve: (source, args, ctx) => ctx.coreData.studio,
    })

    t.nonNull.field('localSettings', {
      type: LocalSettings,
      description: 'local settings on a device-by-device basis',
      resolve: (source, args, ctx) => {
        return ctx.coreData.localSettings
      },
    })

    t.list.nonNull.field('scaffoldedFiles', {
      description: 'The files that have just been scaffolded',
      type: ScaffoldedFile,
      resolve: (_, args, ctx) => ctx.coreData.scaffoldedFiles,
    })

    t.nonNull.boolean('invokedFromCli', {
      description: 'Whether the app was invoked from the CLI, false if user is using the binary directly (not invoked from package manager e.g. npm)',
      resolve: (source, args, ctx) => Boolean(ctx.modeOptions.invokedFromCli),
    })

    t.field('cohort', {
      description: 'Return the cohort for the given name',
      type: Cohort,
      args: {
        name: nonNull(stringArg({ description: 'the name of the cohort to find' })),
      },
      resolve: async (source, args, ctx) => {
        return await ctx.config.cohortsApi.getCohort(args.name) ?? null
      },
    })

    t.field('node', {
      type: 'Node',
      args: {
        id: nonNull(idArg()),
      },
      resolve: (root, args, ctx, info) => {
        // Cast as any, because this is extremely difficult to type correctly
        return ctx.graphql.resolveNode(args.id, ctx, info) as any
      },
    })

    t.string('machineId', {
      description: 'Unique node machine identifier for this instance - may be nil if unable to resolve',
      resolve: async (source, args, ctx) => await ctx.coreData.machineId,
    })
  },
  sourceType: {
    module: '@packages/graphql',
    export: 'RemoteExecutionRoot',
  },
})
