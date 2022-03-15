import { objectType } from 'nexus'
import { ProjectLike, ScaffoldedFile } from '..'
import { CurrentProject } from './gql-CurrentProject'
import { DevState } from './gql-DevState'
import { AuthState } from './gql-AuthState'
import { LocalSettings } from './gql-LocalSettings'
import { Migration } from './gql-Migration'
import { VersionData } from './gql-VersionData'
import { Wizard } from './gql-Wizard'
import { ErrorWrapper } from './gql-ErrorWrapper'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.field('baseError', {
      type: ErrorWrapper,
      resolve: (root, args, ctx) => ctx.baseError,
    })

    t.nonNull.list.nonNull.field('warnings', {
      type: ErrorWrapper,
      description: 'A list of warnings',
      resolve: (source, args, ctx) => {
        return ctx.coreData.warnings
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
      resolve: (root, args, ctx) => ctx.coreData.migration,
    })

    t.nonNull.field('dev', {
      type: DevState,
      description: 'The state of any info related to local development of the runner',
      resolve: (root, args, ctx) => ctx.coreData.dev,
    })

    t.field('versions', {
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
      resolve: (root, args, ctx) => ctx.appData.projects,
    })

    t.nonNull.boolean('isInGlobalMode', {
      description: 'Whether the app is in global mode or not',
      resolve: (source, args, ctx) => !ctx.currentProjectRoot,
    })

    t.nonNull.boolean('projectRootFromCI', {
      description: 'Whether the project was specified from the --project flag',
      resolve: (source, args, ctx) => Boolean(ctx.modeOptions.projectRoot),
    })

    t.nonNull.field('authState', {
      type: AuthState,
      description: 'The latest state of the auth process',
      resolve: (source, args, ctx) => ctx.coreData.authState,
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
  },
})
