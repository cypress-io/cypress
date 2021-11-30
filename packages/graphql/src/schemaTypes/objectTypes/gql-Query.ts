import { nonNull, objectType } from 'nexus'
import { ApplicationError, WizardSampleConfigFile } from '.'
import { ProjectLike, WizardSetupInput } from '..'
import { CurrentProject } from './gql-CurrentProject'
import { DevState } from './gql-DevState'
import { LocalSettings } from './gql-LocalSettings'
import { VersionData } from './gql-VersionData'
import { Warning } from './gql-Warning'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.field('globalError', {
      type: ApplicationError,
      description: 'A "global error" is something that should never occur, and means that we need to clear application state and prompt to file an issue on GitHub',
      resolve: (root, args, ctx) => ctx.coreData.globalError,
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
        return ctx.versions()
      },
    })

    t.field('currentProject', {
      type: CurrentProject,
      description: 'The currently opened project',
      resolve: (root, args, ctx) => ctx.project,
    })

    t.list.nonNull.field('projects', {
      type: ProjectLike,
      description: 'All known projects for the app',
      resolve: (root, args, ctx) => ctx.projectsList,
    })

    t.nonNull.list.nonNull.field('warnings', {
      type: Warning,
      description: 'A list of warnings',
      resolve: (source, args, ctx) => {
        return ctx.coreData.warnings
      },
    })

    t.list.nonNull.field('sampleConfigFiles', {
      type: WizardSampleConfigFile,
      args: {
        input: nonNull(WizardSetupInput),
      },
      description: 'Set of sample configuration files based bundler, framework and language of choice',
      resolve: (source, args, ctx) => ctx.wizard.sampleConfigFiles(args.input),
    })

    t.string('sampleTemplate', {
      description: 'IndexHtml file based on bundler and framework of choice',
      args: {
        input: nonNull(WizardSetupInput),
      },
      resolve: (source, args, ctx) => ctx.wizard.sampleTemplate(args.input),
    })

    t.nonNull.boolean('isInGlobalMode', {
      description: 'Whether the app is in global mode or not',
      resolve: (source, args, ctx) => !ctx.currentProject,
    })

    t.nonNull.boolean('isAuthBrowserOpened', {
      description: 'Whether the browser has been opened for auth or not',
      resolve: (source, args, ctx) => ctx.coreData.isAuthBrowserOpened,
    })

    t.field('localSettings', {
      type: LocalSettings,
      description: 'local settings on a device-by-device basis',
      resolve: (source, args, ctx) => {
        return ctx.loadingManager.localSettings.load().then((val) => val ?? null)
      },
    })
  },
})
