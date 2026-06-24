import { useAutStore } from '../../store'
import { tapManagerDataSource } from '../TapManagerDataSource'
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

export const tapRunStateSource = {
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
  handler: async (): Promise<RunStateResult> => {
    const totalSpecs = tapManagerDataSource.getRunnableSpecs().length
    const runner = tapManagerDataSource.getRunner()

    if (!runner) {
      return { spec: null, totalSpecs }
    }

    const { results, totalTests } = aggregateResults(runner)
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
