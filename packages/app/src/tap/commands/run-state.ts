import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { getPinnedView, reconcilePin } from './pin'
import { aggregateResults } from '../test-state'
import type { RunResults } from '../test-state'
import type { PinnedView } from '../contract'

export interface RunStateResult {
  spec: string | null
  totalSpecs: number
  /**
   * Where the selected spec is in its run. `loading` is a spec still building
   * and is never a verdict; only `passed`/`failed` are. A build that fails is
   * `failed`, reported with `error` and no counts.
   */
  state?: 'loading' | 'running' | 'passed' | 'failed'
  /**
   * The run every other field describes, named by the driver's own start time;
   * `null` while loading. A rerun leaves the previous run's finished verdict
   * readable until the incoming one starts, and that payload is identical on
   * every other field — this is what tells the two apart.
   */
  startedAt?: string | null
  totalTests?: number
  results?: RunResults
  /** Why the spec could not run, when it failed to build. */
  error?: string
  /** The currently pinned command, if any — only reported once verified against a live runner (see the pin command). */
  pinned?: PinnedView
}

// The app shows the whole build failure over the AUT — compiler stack and the
// terminal colors webpack writes into its code frame. Status is a polling
// payload read by a machine, so keep the part that identifies the failure and
// drop the compiler's own stack.
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;]*m/g

const buildFailure = (error: string): string => {
  return error.split('\n    at ')[0].replace(ANSI, '').trim()
}

export const runStateCommand = defineCommand('run-state', async (): Promise<RunStateResult> => {
  const totalSpecs = tapManagerDataSource.getRunnableSpecs().length
  const spec = tapManagerDataSource.getActiveSpecRelative()

  if (spec === undefined) {
    return { spec: null, totalSpecs }
  }

  const runner = tapManagerDataSource.getRunner()
  const error = tapManagerDataSource.getScriptError()

  // A spec that failed to build never ran, however settled its runner looks: it
  // reaches mocha with no tests, so it aggregates to the same all-zero sweep a
  // wholly passing run does. The build failure is the only thing that tells
  // them apart, and it is terminal — a poller has to stop on it, not wait.
  if (error) {
    return { spec, totalSpecs, state: 'failed', startedAt: runner?.getStartTime() ?? null, error: buildFailure(error) }
  }

  if (!runner) {
    return { spec, totalSpecs, state: 'loading', startedAt: null }
  }

  // Release a stale pin (from a previous run) so status never reports one that
  // no longer exists.
  const snapshotRunner = tapManagerDataSource.getSnapshotRunner()

  if (snapshotRunner) {
    reconcilePin(snapshotRunner)
  }

  const pinned = getPinnedView(runner)
  const { results, totalTests } = aggregateResults(runner)
  const state = !runner.isRunComplete() ? 'running' : results.failed > 0 ? 'failed' : 'passed'

  return {
    spec,
    totalSpecs,
    state,
    startedAt: runner.getStartTime(),
    totalTests,
    results,
    ...(pinned ? { pinned } : {}),
  }
})
