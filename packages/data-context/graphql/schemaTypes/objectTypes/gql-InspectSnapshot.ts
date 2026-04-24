import { objectType } from 'nexus'
import type { CoreDataShape, ActiveRunShape, TestResultShape } from '../../../src/data/coreDataShape'
import { Browser } from './gql-Browser'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { BrowserStatusEnum } from '../enumTypes/gql-BrowserStatus'
import { AppRouteEnum } from '../enumTypes/gql-AppRoute'

/**
 * Derive aggregate pass/fail/pending/skipped counts from the per-test map.
 * Exposed as a computed field so there's no sync bug where counts drift
 * from results.
 */
function deriveStats (activeRun: ActiveRunShape) {
  // `tests` may be absent on ActiveRun objects constructed outside the
  // RunStateActions flow (older fixtures, ad-hoc test setup). Treat as empty.
  const entries = Object.values(activeRun.tests ?? {})
  const stats = { passed: 0, failed: 0, pending: 0, skipped: 0, total: entries.length }

  for (const t of entries) {
    if (t.state === 'passed') stats.passed++
    else if (t.state === 'failed') stats.failed++
    else if (t.state === 'pending') stats.pending++
    else if (t.state === 'skipped') stats.skipped++
  }

  return stats
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('@packages/root')

export type AppRoute =
  | 'INTRO'
  | 'TESTING_TYPE_SELECTION'
  | 'BROWSER_SELECTION'
  | 'SPEC_LIST'
  | 'SPEC_RUNNING'
  | 'ERROR'

/**
 * Derives the high-level AppRoute from the current open-mode core data.
 *
 * Pure function — takes only the data it needs so it is trivially unit-testable
 * without spinning up a DataContext.
 */
export function deriveAppRoute (coreData: CoreDataShape): AppRoute {
  if (coreData.diagnostics?.error) {
    return 'ERROR'
  }

  if (!coreData.currentProject) {
    return 'INTRO'
  }

  if (!coreData.currentTestingType) {
    return 'TESTING_TYPE_SELECTION'
  }

  if (!coreData.activeBrowser) {
    return 'BROWSER_SELECTION'
  }

  // An active run is only `SPEC_RUNNING` while it is still in flight. A
  // terminal `finished` entry lingers in `activeRun` so the CLI's `--wait`
  // poll can observe the outcome; the UI has already returned to the spec
  // list by then, so we fall through to `SPEC_LIST`.
  if (coreData.activeRun && coreData.activeRun.status === 'running') {
    return 'SPEC_RUNNING'
  }

  return 'SPEC_LIST'
}

export const TestResult = objectType({
  name: 'TestResult',
  description: 'Outcome of a single test. Retries produce updates to the same record, so this always reflects the latest attempt.',
  definition (t) {
    t.nonNull.string('testId', { description: 'Mocha-assigned id for the test. Stable across retries.' })
    t.nonNull.string('title', { description: 'Leaf title of the test.' })
    t.nonNull.list.nonNull.string('titlePath', { description: 'Full describe/it path, outermost first.' })
    t.nonNull.string('state', { description: `One of 'passed' | 'failed' | 'pending' | 'skipped'.` })
    t.int('duration', { description: 'Duration in ms for the latest attempt. Null if not reported.' })
    t.nonNull.int('currentRetry', { description: 'Zero-based attempt index of the latest attempt.' })
    t.string('error', { description: 'Error message for the latest attempt, if any.' })
  },
})

export const CommandLog = objectType({
  name: 'CommandLog',
  description: 'A single entry from the driver command log — roughly what renders as a line in the reporter\'s left-side command bar.',
  definition (t) {
    t.nonNull.string('id', { description: 'Driver-assigned log id. Stable across the add/change lifecycle.' })
    t.nonNull.string('name', { description: `Command name (e.g. 'visit', 'get', 'click').` })
    t.nonNull.string('message', { description: 'Display message for the command, typically the argument(s).' })
    t.nonNull.string('state', { description: `One of 'pending' | 'passed' | 'failed' | 'warn'.` })
    t.nonNull.string('type', { description: `Log type (e.g. 'parent', 'child', 'system').` })
    t.string('testId', { description: 'Mocha test id this command belongs to, if any.' })
    t.string('displayName', { description: 'Optional display override for the command name.' })
    t.int('number', { description: '1-based ordinal of the command within its test, if assigned.' })
    t.nonNull.int('snapshotCount', { description: 'Number of DOM snapshots captured for this command (0 if none).' })
    t.nonNull.boolean('hasSnapshot', { description: 'Whether the command captured at least one DOM snapshot (mirrors the reporter indicator).' })
    t.nonNull.boolean('hasConsoleProps', { description: 'Whether the command has a non-trivial consoleProps payload (fetchable via `inspectCommandInfo` or `pinnedCommand.consolePropsJson`).' })
    t.int('timeout', { description: 'Command timeout in ms.' })
    t.int('numElements', { description: 'Matched DOM element count for DOM-targeting commands.' })
    t.boolean('visible', { description: 'Whether the yielded subject was visible. Null for commands not tied to DOM (e.g. `cy.visit`, `cy.readFile`).' })
    t.int('groupLevel', { description: 'Nesting depth of the command within collapsible groups. 0 for root-level.' })
    t.int('group', { description: 'Id of the parent group log, if any.' })
    t.string('alias', { description: 'Alias assigned via `cy.as()`, if any.' })
    t.string('aliasType', { description: `One of 'dom' | 'primitive' | 'agent' | 'route' when an alias is set.` })
    t.list.nonNull.string('referencesAlias', { description: 'Aliases this command references (e.g. `@foo`).' })
    t.string('hookId', { description: 'Id of the hook containing this command, if any.' })
    t.string('error', { description: 'Error message for this command, if the command failed.' })
    t.string('wallClockStartedAt', { description: 'ISO 8601 timestamp of when the command was logged.' })
  },
})

export const PinnedCommand = objectType({
  name: 'PinnedCommand',
  description: 'The command log entry currently pinned in the reporter (selected via `cypress inspect command pin`). Null when nothing is pinned.',
  definition (t) {
    t.nonNull.string('testId', { description: 'Runtime id of the test the pinned command belongs to.' })
    t.nonNull.string('logId', { description: 'Driver-assigned log id of the pinned command.' })
    t.nonNull.field('command', {
      type: CommandLog,
      description: 'Full metadata for the pinned command — the matching entry from `activeRun.commands`.',
    })

    t.string('consolePropsJson', {
      description: 'Safely-serialized `consoleProps` dump for the pinned command. Null if the driver could not produce console props (e.g. after memory cleanup).',
    })
  },
})

export const TestStats = objectType({
  name: 'TestStats',
  description: 'Aggregate pass/fail/pending/skipped counts, derived from the per-test results on the containing run.',
  definition (t) {
    t.nonNull.int('passed')
    t.nonNull.int('failed')
    t.nonNull.int('pending')
    t.nonNull.int('skipped')
    t.nonNull.int('total')
  },
})

export const ActiveRun = objectType({
  name: 'ActiveRun',
  description: 'The most recent spec run for this open-mode instance. While in flight, `status` is `running`; after `run:end` fires it transitions to `finished` and lingers so CLI consumers can poll for completion.',
  definition (t) {
    t.nonNull.string('specPath', {
      description: 'Absolute path to the spec that is running (or just finished).',
    })

    t.nonNull.dateTime('startedAt', {
      description: 'When the run started.',
    })

    t.dateTime('endedAt', {
      description: 'When the run ended. Null while `status === running`.',
    })

    t.nonNull.string('status', {
      description: `One of 'starting' | 'running' | 'finished'.`,
    })

    t.nonNull.list.nonNull.field('tests', {
      type: TestResult,
      description: 'Per-test outcomes reported so far. Empty until the driver emits the first `test:after:run`.',
      resolve: (source) => {
        const tests = (source as ActiveRunShape).tests ?? {}

        return Object.values(tests) as TestResultShape[]
      },
    })

    t.nonNull.field('stats', {
      type: TestStats,
      description: 'Aggregate counts derived from `tests`.',
      resolve: (source) => deriveStats(source as ActiveRunShape),
    })

    t.nonNull.list.nonNull.field('commands', {
      type: CommandLog,
      description: 'Command log entries for the test currently targeted by Studio. Empty outside Studio mode — sourced on demand from the reporter store, not buffered server-side.',
      resolve: async (source, args, ctx) => {
        const studioActiveTestId = ctx.coreData.studioActiveTestId

        if (!studioActiveTestId) {
          return []
        }

        const snapshot = await ctx._apis.projectApi.requestCommandsSnapshot(studioActiveTestId)

        // Defensive normalization: the wire shape from the runner can evolve
        // ahead of / behind server changes (reporter bundle is embedded in
        // the browser and can lag a server-side schema change during dev).
        // Backfill required fields so GraphQL non-null contracts always hold.
        return (snapshot ?? []).map((c) => {
          return {
            ...c,
            snapshotCount: typeof c.snapshotCount === 'number' ? c.snapshotCount : 0,
            hasSnapshot: typeof c.hasSnapshot === 'boolean' ? c.hasSnapshot : false,
            hasConsoleProps: typeof c.hasConsoleProps === 'boolean' ? c.hasConsoleProps : false,
          }
        })
      },
    })
  },
})

export const InspectSnapshot = objectType({
  name: 'InspectSnapshot',
  description: 'Aggregated, read-only view of the open-mode instance state — consumed by the `cypress inspect` CLI.',
  definition (t) {
    t.nonNull.int('pid', {
      description: 'Process id of the open-mode instance.',
      resolve: () => process.pid,
    })

    t.nonNull.string('cypressVersion', {
      description: 'Version of Cypress running in this instance.',
      resolve: () => pkg.version,
    })

    t.string('projectRoot', {
      description: 'Absolute path to the currently-opened project, or null if no project is loaded.',
      resolve: (source, args, ctx) => ctx.coreData.currentProject,
    })

    t.field('testingType', {
      type: TestingTypeEnum,
      description: 'The currently selected testing type, or null if not yet chosen.',
      resolve: (source, args, ctx) => ctx.coreData.currentTestingType,
    })

    t.field('browserStatus', {
      type: BrowserStatusEnum,
      description: 'The status of the browser currently controlled by the instance.',
      resolve: (source, args, ctx) => ctx.coreData.app.browserStatus,
    })

    t.field('activeBrowser', {
      type: Browser,
      description: 'The currently-selected browser, or null if none is selected.',
      resolve: (source, args, ctx) => ctx.coreData.activeBrowser,
    })

    t.nonNull.field('appRoute', {
      type: AppRouteEnum,
      description: 'Derived high-level route of the app UI.',
      resolve: (source, args, ctx) => deriveAppRoute(ctx.coreData),
    })

    t.field('activeRun', {
      type: ActiveRun,
      description: 'An in-progress (or most recently finished) spec run, if any. Null when no spec has been launched in this instance yet.',
      resolve: (source, args, ctx) => ctx.coreData.activeRun,
    })

    t.nonNull.int('specCount', {
      description: 'Number of specs discovered for the current project.',
      resolve: (source, args, ctx) => ctx.project.specs?.length ?? 0,
    })

    t.string('studioActiveTestId', {
      description: 'Runtime id of the test currently targeted by Studio, or null if Studio is not active.',
      resolve: (source, args, ctx) => ctx.coreData.studioActiveTestId,
    })

    t.field('pinnedCommand', {
      type: PinnedCommand,
      description: 'The command currently pinned in the reporter. Only populated when Studio is active on a test; otherwise null.',
      resolve: async (source, args, ctx) => {
        const testId = ctx.coreData.studioActiveTestId

        if (!testId) {
          return null
        }

        const pinned = await ctx._apis.projectApi.requestPinnedCommand(testId)

        if (!pinned) {
          return null
        }

        // Combine with the matching CommandLog entry so consumers get the
        // full metadata block alongside the consoleProps dump in one field.
        const commandsSnapshot = await ctx._apis.projectApi.requestCommandsSnapshot(testId)
        const command = commandsSnapshot?.find((c) => c.id === pinned.logId)

        if (!command) {
          return null
        }

        return {
          testId,
          logId: pinned.logId,
          command,
          consolePropsJson: pinned.consolePropsJson,
        }
      },
    })
  },
})
