import { tapManagerDataSource } from '../tap-manager-data-source'
import { defineCommand } from './definition'
import { aggregateResults } from './test-state'
import type { RunResults } from './test-state'

export interface RunStateResult {
  spec: string | null
  totalSpecs: number
  state?: 'running' | 'passed' | 'failed'
  totalTests?: number
  results?: RunResults
}

export const runStateCommand = defineCommand({
  description: 'report where the running Cypress instance is in its run lifecycle',
  // The CLI surfaces this through the friendlier `status` command, not as its own.
  hidden: true,
  params: [],
  handler: async (_params, _options, runtime): Promise<RunStateResult> => {
    const totalSpecs = (await tapManagerDataSource.getRunnableSpecs(runtime.gqlClient)).length
    const runner = tapManagerDataSource.getRunner()

    if (!runner) {
      return { spec: null, totalSpecs }
    }

    const { results, totalTests } = aggregateResults(runner)
    const state = !runner.isRunComplete() ? 'running' : results.failed > 0 ? 'failed' : 'passed'

    return {
      spec: tapManagerDataSource.getActiveSpecRelative() ?? null,
      totalSpecs,
      state,
      totalTests,
      results,
    }
  },
})
