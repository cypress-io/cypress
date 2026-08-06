import type { FoundSpec } from '@packages/types'

import { posixify } from '../paths'
import { getAutIframeModel } from '../runner'
import { useSnapshotStore } from '../runner/snapshot-store'
import { useAutStore } from '../store'
import type { PinAutIframe, PinSnapshotProps, PinSnapshotRunner, TapTestsRunner } from './types'

// The runner-page event manager, reached through the app's own window binding —
// never `window.Cypress`, which is the outer driver in cypress-in-cypress.
const eventManager = () => {
  try {
    return window.getEventManager?.()
  } catch {
    return undefined
  }
}

export const tapManagerDataSource = {
  getRunner (): TapTestsRunner | undefined {
    try {
      // Both a throw and undefined here mean there is no run to read yet.
      const em = eventManager()
      const runner = em?.getCypress()?.runner

      if (!em || !runner) {
        return undefined
      }

      // A runner exists from the moment its spec is installed, but holds no test
      // state until mocha starts it — and `runComplete` still describes the
      // previous run until then. The driver's start time is the one signal that
      // belongs to this runner alone, so gate on it: a readable run is a started
      // one, and every command reports the run it names.
      if (runner.getStartTime() == null) {
        return undefined
      }

      return {
        getAllTestsState: runner.getAllTestsState,
        getTestState: runner.getTestState,
        getSerializedConsolePropsForLog: runner.getSerializedConsolePropsForLog,
        isRunComplete: () => em.runComplete,
        getStartTime: runner.getStartTime,
      }
    } catch {
      return undefined
    }
  },

  getSnapshotRunner (): PinSnapshotRunner | undefined {
    try {
      return eventManager()?.getCypress()?.runner
    } catch {
      return undefined
    }
  },

  getActiveSpecRelative (): string | undefined {
    try {
      const relative = eventManager()?.getCypress()?.spec?.relative

      // POSIX-normalize so status reports the same path shape the specs and run
      // commands emit; spec.relative is OS-native (backslashes on Windows).
      return relative !== undefined ? posixify(relative) : undefined
    } catch {
      return undefined
    }
  },

  getRunnableSpecs (): FoundSpec[] {
    return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
  },

  getAutIframe (): PinAutIframe | undefined {
    try {
      return getAutIframeModel() as unknown as PinAutIframe
    } catch {
      return undefined
    }
  },

  isRunning (): boolean {
    try {
      return useAutStore().isRunning
    } catch {
      return false
    }
  },

  // The spec's own build failure, as the app shows it over the AUT. Cleared at
  // the start of every run, so it always belongs to the spec now selected.
  getScriptError (): string | undefined {
    try {
      return useAutStore().scriptError?.error
    } catch {
      return undefined
    }
  },

  pinSnapshot (props: PinSnapshotProps, index: number, testId: string, logId: string): void {
    eventManager()?.localBus.emit('pin:snapshot', props)

    if (index !== 0) {
      tapManagerDataSource.changeSnapshotState(index)
    }

    eventManager()?.snapshotPinned(testId, logId)
  },

  // The command whose snapshot the app is showing, however it came to be pinned:
  // the snapshot store is where the tap pin command and a click on a command in
  // the reporter both land, and the props it holds name their log and test (see
  // the driver's SNAPSHOT_PROPS). `index` is the snapshot of that command showing.
  getPinnedSnapshot (): { testId: string, logId: string, index: number } | undefined {
    try {
      const store = useSnapshotStore()

      if (!store.isSnapshotPinned) {
        return undefined
      }

      const { id, testId } = store.snapshotProps ?? {}

      if (id === undefined || testId === undefined) {
        return undefined
      }

      return { testId, logId: id, index: store.snapshot?.stateIndex ?? 0 }
    } catch {
      return undefined
    }
  },

  changeSnapshotState (index: number): void {
    try {
      useSnapshotStore().changeState(index, getAutIframeModel())
    } catch {
      // No store/iframe in this context — nothing to switch.
    }
  },

  unpinSnapshot (): void {
    eventManager()?.snapshotUnpinned()
  },

  onSnapshotUnpinned (handler: () => void): () => void {
    const em = eventManager()

    if (!em) {
      return () => {}
    }

    // localBus `unpin:snapshot` is the one event every app-side unpin funnels
    // through — the ✕ over the AUT and clicking the pinned command in the
    // reporter; the reporterBus `reporter:snapshot:unpinned` event only fires
    // for the ✕, so listening there would miss the reporter-click unpin.
    em.localBus.on('unpin:snapshot', handler)

    return () => {
      em.localBus.off('unpin:snapshot', handler)
    }
  },
}
