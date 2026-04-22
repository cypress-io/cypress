import { objectType } from 'nexus'
import type { CoreDataShape } from '../../../src/data/coreDataShape'
import { Browser } from './gql-Browser'
import { TestingTypeEnum } from '../enumTypes/gql-WizardEnums'
import { BrowserStatusEnum } from '../enumTypes/gql-BrowserStatus'
import { AppRouteEnum } from '../enumTypes/gql-AppRoute'

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
 * without spinning up a DataContext. `SPEC_RUNNING` is reserved for Phase 2 once
 * the run-lifecycle signal lands; today the deepest route we surface is
 * `SPEC_LIST`.
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

  return 'SPEC_LIST'
}

export const ActiveRun = objectType({
  name: 'ActiveRun',
  description: 'A spec run that is currently in progress. Populated in Phase 2.',
  definition (t) {
    t.nonNull.string('specPath', {
      description: 'Absolute path to the spec that is running.',
    })

    t.nonNull.dateTime('startedAt', {
      description: 'When the run started.',
    })

    t.nonNull.string('status', {
      description: `One of 'starting' | 'running' | 'finished' | 'errored'.`,
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
      description: 'An in-progress spec run, if any. Always null until Phase 2 lifecycle wiring lands.',
      // populated in Phase 2
      resolve: () => null,
    })

    t.nonNull.int('specCount', {
      description: 'Number of specs discovered for the current project.',
      resolve: (source, args, ctx) => ctx.project.specs?.length ?? 0,
    })
  },
})
