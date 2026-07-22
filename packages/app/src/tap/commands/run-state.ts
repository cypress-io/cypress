import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { getPinnedRef, reconcilePin } from './pin'
import { aggregateResults } from '../test-state'
import type { RunResults } from '../test-state'

export interface RunStateResult {
  spec: string | null
  totalSpecs: number
  state?: 'running' | 'passed' | 'failed'
  totalTests?: number
  results?: RunResults
  /** The currently pinned command's snapshot, if any — only reported once verified against a live runner (see the pin command). */
  pinned?: { command: string, at: { index: number, name?: string } }
}

export const runStateCommand = defineCommand({
  description: 'report where the running Cypress instance is in its run lifecycle',
  // The CLI surfaces this through the friendlier `status` command, not as its own.
  hidden: true,
  params: [],
  handler: async (): Promise<RunStateResult> => {
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

    const pinned = getPinnedRef()
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
  },
})
