import { idArg, list, stringArg, nonNull, objectType } from 'nexus'
import path from 'path'
import { ProjectLike } from '../interfaceTypes/gql-ProjectLike'
import { ScaffoldedFile } from './gql-ScaffoldedFile'
import { CurrentProject } from './gql-CurrentProject'
import { DevState } from './gql-DevState'
import { AuthState } from './gql-AuthState'
import { LocalSettings } from './gql-LocalSettings'
import { VersionData } from './gql-VersionData'
import { Wizard } from './gql-Wizard'
import { ErrorWrapper } from './gql-ErrorWrapper'
import { CachedUser } from './gql-CachedUser'
import { Cohort } from './gql-Cohorts'
import { InspectSnapshot } from './gql-InspectSnapshot'
import { AutInspectResult } from '../unions/gql-AutInspectResult'
import { AutInspectDomResult } from '../unions/gql-AutInspectDomResult'
import { AutInspectSnapshotResult } from '../unions/gql-AutInspectSnapshotResult'
import { InspectCommandInfoResult } from '../unions/gql-InspectCommandInfoResult'

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

    t.nonNull.field('inspectSnapshot', {
      type: InspectSnapshot,
      description: 'A snapshot of the current open-mode instance state, for CLI inspection.',
      // Return a truthy object so field-level resolvers (which all read from `ctx`) run.
      // The concrete root object is irrelevant; every field resolver derives its value
      // from `ctx.coreData` / `ctx.project`.
      resolve: () => ({}),
    })

    t.nonNull.field('autInspect', {
      type: AutInspectResult,
      description: 'Snapshot of the AUT iframe (URL, title, viewport). Studio-gated: requires `studioActiveTestId` to be set (see `inspect test open`).',
      resolve: async (source, args, ctx) => {
        if (!ctx.coreData.studioActiveTestId) {
          return {
            code: 'NOT_IN_STUDIO' as const,
            detailMessage: 'No test is currently open in Studio. Run `cypress inspect test open <selector>` first.',
          }
        }

        const response = await ctx._apis.projectApi.requestAutInspectRoot()

        if (!response) {
          return { code: 'TIMEOUT' as const, detailMessage: 'AUT did not respond within the socket timeout.' }
        }

        if ('error' in response) {
          return { code: response.error, detailMessage: response.detailMessage }
        }

        return response.data
      },
    })

    t.nonNull.field('autInspectDom', {
      type: AutInspectDomResult,
      description: 'Query the AUT DOM by CSS selector. Returns up to 20 matches with tag/attrs/truncated text/outerHTML. Studio-gated.',
      args: {
        selector: nonNull(stringArg({
          description: 'CSS selector to query in the AUT document.',
        })),
      },
      resolve: async (source, args, ctx) => {
        if (!ctx.coreData.studioActiveTestId) {
          return {
            code: 'NOT_IN_STUDIO' as const,
            detailMessage: 'No test is currently open in Studio. Run `cypress inspect test open <selector>` first.',
          }
        }

        const response = await ctx._apis.projectApi.requestAutInspectDom(args.selector)

        if (!response) {
          return { code: 'TIMEOUT' as const, detailMessage: 'AUT did not respond within the socket timeout.' }
        }

        if ('error' in response) {
          return { code: response.error, detailMessage: response.detailMessage }
        }

        return response.data
      },
    })

    t.nonNull.field('inspectCommandInfo', {
      type: InspectCommandInfoResult,
      description: 'Read-only detail for one or more commands by log id: the matching `CommandLog` entry plus its safe-stringified `consoleProps`. Studio-gated. Unlike `pinnedCommand`, this has no side effects on the reporter UI and supports batch fetch.',
      args: {
        logIds: nonNull(list(nonNull(stringArg({
          description: 'Driver-assigned log ids to fetch. Order is preserved in the response `items`.',
        })))),
      },
      resolve: async (source, args, ctx) => {
        const studioActiveTestId = ctx.coreData.studioActiveTestId

        if (!studioActiveTestId) {
          return {
            code: 'NOT_IN_STUDIO' as const,
            detailMessage: 'No test is currently open in Studio. Run `cypress inspect test open <selector>` first.',
          }
        }

        if (args.logIds.length === 0) {
          return {
            code: 'LOG_NOT_FOUND' as const,
            detailMessage: 'At least one log id is required.',
          }
        }

        const snapshot = await ctx._apis.projectApi.requestCommandsSnapshot(studioActiveTestId)
        const commands = snapshot ?? []
        const commandsById = new Map(commands.map((c) => [c.id, c]))
        const missing = args.logIds.filter((id) => !commandsById.has(id))

        if (missing.length > 0) {
          return {
            code: 'LOG_NOT_FOUND' as const,
            detailMessage: `Unknown log id(s): ${missing.join(', ')}`,
          }
        }

        const consoleProps = await ctx._apis.projectApi.requestCommandConsoleProps(studioActiveTestId, args.logIds)

        if (!consoleProps) {
          return {
            code: 'TIMEOUT' as const,
            detailMessage: 'Runner did not respond within the socket timeout.',
          }
        }

        const consolePropsById = new Map(consoleProps.map((c) => [c.logId, c.consolePropsJson]))

        const items = args.logIds.map((id) => {
          const cmd = commandsById.get(id)!

          return {
            command: {
              ...cmd,
              snapshotCount: typeof cmd.snapshotCount === 'number' ? cmd.snapshotCount : 0,
              hasSnapshot: typeof cmd.hasSnapshot === 'boolean' ? cmd.hasSnapshot : false,
              hasConsoleProps: typeof cmd.hasConsoleProps === 'boolean' ? cmd.hasConsoleProps : false,
            },
            consolePropsJson: consolePropsById.get(id) ?? null,
          }
        })

        return { items }
      },
    })

    t.nonNull.field('autInspectSnapshot', {
      type: AutInspectSnapshotResult,
      description: 'Compact accessibility-tree snapshot of the AUT with unique CSS selectors per node. Studio-gated.',
      resolve: async (source, args, ctx) => {
        if (!ctx.coreData.studioActiveTestId) {
          return {
            code: 'NOT_IN_STUDIO' as const,
            detailMessage: 'No test is currently open in Studio. Run `cypress inspect test open <selector>` first.',
          }
        }

        const response = await ctx._apis.projectApi.requestAutInspectSnapshot()

        if (!response) {
          return { code: 'TIMEOUT' as const, detailMessage: 'AUT did not respond within the socket timeout.' }
        }

        if ('error' in response) {
          return { code: response.error, detailMessage: response.detailMessage }
        }

        return response.data
      },
    })
  },
  sourceType: {
    module: path.join(__dirname, '../../'),
    export: 'RemoteExecutionRoot',
  },
})
