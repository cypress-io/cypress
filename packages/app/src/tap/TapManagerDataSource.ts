import type { FoundSpec } from '@packages/types'

import type { TapTestsRunner } from './types'

// Every runner-window global a tap command reads (or writes) goes through this
// one seam, so component tests stub a method here instead of the real globals.
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
        getTestsState: runner.getTestsState,
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
