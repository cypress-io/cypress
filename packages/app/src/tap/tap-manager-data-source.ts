import type { FoundSpec } from '@packages/types'

import type { TapTestsRunner } from './types'

export const tapManagerDataSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // Both a throw and undefined here mean there is no run to read yet.
      const eventManager = window.getEventManager?.()
      const runner = eventManager?.getCypress()?.runner

      if (!eventManager || !runner) {
        return undefined
      }

      return {
        getAllTestsState: runner.getAllTestsState,
        getTestState: runner.getTestState,
        isRunComplete: () => eventManager.runComplete,
      }
    } catch {
      return undefined
    }
  },

  getRunnableSpecs (): FoundSpec[] {
    return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
  },

  getHash () {
    return window.location.hash
  },

  setHash (hash: string) {
    window.location.hash = hash
  },
}
