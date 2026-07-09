import { getAutIframeModel } from '../../runner'
import { useSnapshotStore } from '../../runner/snapshot-store'
import { useAutStore } from '../../store'
import type { SerializedTest } from '@packages/types'

/**
 * One snapshot on a command log, as `getSnapshotPropsForLog` exposes it: the
 * cloned body sits behind an opaque object that `restoreDom` knows how to
 * render. We read only the optional `name` (to select/label it) and otherwise
 * treat the entry as opaque.
 */
export interface PinSnapshotEntry {
  name?: string
}

export interface PinSnapshotProps {
  url?: string
  snapshots?: Array<PinSnapshotEntry | null | undefined> | null
}

export interface PinRunner {
  getTestState (testId: string): SerializedTest | undefined
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/**
 * The slice of the AUT iframe the pin command drives directly. `detachDom`
 * captures (and detaches) the current body so it can be put back on release —
 * the reliable restore the app's own unpin can't give a cold pin (see below).
 */
export interface PinAutIframe {
  detachDom (): unknown
  restoreDom (snapshot: unknown): void
}

// The runner-page event manager, reached through the app's own window binding —
// never `window.Cypress`, which is the outer driver in cypress-in-cypress.
const eventManager = () => {
  try {
    return window.getEventManager?.()
  } catch {
    return undefined
  }
}

/**
 * Seam over the driver runner, the AUT iframe, the snapshot store, and the
 * runner's own pin machinery the pin command drives. Component tests stub this
 * object.
 *
 * The pin routes through the app's native pin (`pin:snapshot` →
 * `iframe-model._pinSnapshot`) so the runner reflects it exactly like a
 * user-clicked pin — the "Pinned" banner, the snapshot-state toggle, and the
 * highlight controls — and the reporter is notified on release. We still
 * capture and restore the pre-pin DOM ourselves via the AUT iframe: the app's
 * unpin can only restore state captured during a hover, which a programmatic
 * pin never performs.
 */
export const tapPinSource = {
  getRunner (): PinRunner | undefined {
    try {
      return eventManager()?.getCypress()?.runner
    } catch {
      return undefined
    }
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

  // Drive the app's own pin: `_pinSnapshot` renders `snapshots[0]` and sets the
  // store (banner, controls, `isSnapshotPinned`). `--at` can pick any snapshot,
  // so move to it afterwards — the app always starts on the first. Finally sync
  // the reporter's command log, which a native (reporter-originated) pin sets
  // itself but a programmatic pin must notify.
  pinSnapshot (props: PinSnapshotProps, index: number, testId: string, logId: string): void {
    // `iframe-model` listens for `pin:snapshot` on the localBus; emit there
    // directly (the typed `EventManager.emit` overloads don't cover it).
    eventManager()?.localBus.emit('pin:snapshot', props)

    // `_pinSnapshot` always renders the first snapshot, so only move off it.
    if (index !== 0) {
      tapPinSource.changeSnapshotState(index)
    }

    eventManager()?.snapshotPinned(testId, logId)
  },

  // Switch which of the pinned command's snapshots the runner shows — the same
  // state toggle the pinned banner drives. Lets `pin --at` re-select the state
  // of an existing pin without a clear/re-pin round trip.
  changeSnapshotState (index: number): void {
    try {
      useSnapshotStore().changeState(index, getAutIframeModel())
    } catch {
      // No store/iframe in this context — nothing to switch.
    }
  },

  // The app's canonical unpin: resets the snapshot store (clearing the banner
  // and controls) and notifies the reporter. Does NOT restore a cold pin's DOM,
  // so callers restore the captured body themselves via `restoreDom`.
  unpinSnapshot (): void {
    eventManager()?.snapshotUnpinned()
  },

  // Subscribe to the app's unpin so the runner's ✕ (or any other unpin) can
  // trigger our DOM restore and drop our pin state. Returns a detacher; a no-op
  // when there is no event manager to listen on.
  onUnpinned (handler: () => void): () => void {
    const em = eventManager()

    if (!em) {
      return () => {}
    }

    em.reporterBus.on('reporter:snapshot:unpinned', handler)

    return () => {
      em.reporterBus.off('reporter:snapshot:unpinned', handler)
    }
  },
}
