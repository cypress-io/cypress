import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { getPinnedView, reconcilePin } from './pin'
import { aggregateResults } from '../test-state'
import type { RunResults } from '../test-state'
import type { PinnedView } from '../contract'

export interface RunStateResult {
  spec: string | null
  totalSpecs: number
  state?: 'running' | 'passed' | 'failed'
  totalTests?: number
  results?: RunResults
  /** The currently pinned command, if any — only reported once verified against a live runner (see the pin command). */
  pinned?: PinnedView
}

export const runStateCommand = defineCommand('run-state', async (): Promise<RunStateResult> => {
  const totalSpecs = tapManagerDataSource.getRunnableSpecs().length
  const runner = tapManagerDataSource.getRunner()

  if (!runner) {
    return { spec: null, totalSpecs }
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
    spec: tapManagerDataSource.getActiveSpecRelative() ?? null,
    totalSpecs,
    state,
    totalTests,
    results,
    ...(pinned ? { pinned } : {}),
  }
})
