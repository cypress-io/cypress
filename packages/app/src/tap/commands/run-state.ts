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
   * Where the selected spec is in its run. `loading` is a spec waiting on its
   * own build — one still compiling, or one that never will — and is never a
   * verdict; only `passed`/`failed` are.
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
  /** The currently pinned command, if any — only reported once verified against a live runner (see the pin command). */
  pinned?: PinnedView
}

export const runStateCommand = defineCommand('run-state', async (): Promise<RunStateResult> => {
  const totalSpecs = tapManagerDataSource.getRunnableSpecs().length
  const spec = tapManagerDataSource.getActiveSpecRelative()

  if (spec === undefined) {
    return { spec: null, totalSpecs }
  }

  const runner = tapManagerDataSource.getRunner()

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
