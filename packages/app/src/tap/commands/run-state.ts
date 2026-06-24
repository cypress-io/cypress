import { useAutStore } from '../../store'
import { tapManagerDataSource } from '../TapManagerDataSource'
import { defineCommand } from './definition'
import { aggregateResults } from './test-state'
import type { RunResults } from './test-state'

/**
 * The instance's place in the run lifecycle, as the `status` CLI command reads
 * it. `spec` is the project-relative path of the active spec, or `null` on the
 * spec list (no spec mounted). The run-only fields — `state`, `totalTests`,
 * `results` — are present together exactly when a spec is mounted (`state`
 * gates them), and absent (never `null` — JSON drops `undefined` keys at the
 * CDP boundary) on the spec list. `totalSpecs` is always known.
 */
export interface RunStateResult {
  spec: string | null
  totalSpecs: number
  state?: 'running' | 'passed' | 'failed'
  totalTests?: number
  results?: RunResults
}

/**
 * Seam over the run-lifecycle signals this command reads, so component tests
 * stub it the way `test-state`'s `tapRunnerSource` is stubbed. Both go through
 * the app's own state rather than `window.Cypress` — under the
 * cypress-in-cypress harness `window.Cypress` is the OUTER driver, while the
 * event manager and the app's Pinia store only ever hold this app's instance.
 */
export const tapRunStateSource = {
  // Whether a run is in progress, the canonical app-level signal the reporter
  // controls read — set true on `run:start`, false on `run:end` (see
  // iframe-model). Anything before the store exists means "not running".
  isRunning (): boolean {
    try {
      return useAutStore().isRunning
    } catch {
      return false
    }
  },
  // The active spec's project-relative path, from the same instance the runner
  // commands read. Undefined until a spec is mounted.
  getActiveSpecRelative (): string | undefined {
    try {
      return window.getEventManager?.().getCypress()?.spec?.relative
    } catch {
      return undefined
    }
  },
}

export const runStateCommand = defineCommand({
  description: 'report where the running Cypress instance is in its run lifecycle',
  params: [],
  // Unlike `tests`/`commands`, this never fails when no spec has run: the spec
  // list is a valid lifecycle stage the `status` command must report, so it
  // returns `{ spec: null, totalSpecs }` (the run-only fields omitted) rather
  // than throwing NO_RUN.
  handler: async (): Promise<RunStateResult> => {
    const totalSpecs = tapManagerDataSource.getRunnableSpecs().length
    const runner = tapManagerDataSource.getRunner()

    if (!runner) {
      return { spec: null, totalSpecs }
    }

    const { results, totalTests } = aggregateResults(runner)
    // A run in progress is 'running'; a settled run is 'failed' if any test
    // failed, otherwise 'passed'.
    const state = tapRunStateSource.isRunning() ? 'running' : results.failed > 0 ? 'failed' : 'passed'

    return {
      spec: tapRunStateSource.getActiveSpecRelative() ?? null,
      totalSpecs,
      state,
      totalTests,
      results,
    }
  },
})
