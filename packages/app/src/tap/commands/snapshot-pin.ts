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
  getTestsState (testId?: string): Record<string, SerializedTest>
  getSnapshotPropsForLog (testId: string, logId: string): PinSnapshotProps | undefined
}

/**
 * The slice of the AUT iframe the pin command drives. `restoreDom` renders a
 * snapshot into the live frame; `detachDom` captures (and detaches) the current
 * body so it can be put back on release.
 */
export interface PinAutIframe {
  detachDom (): unknown
  restoreDom (snapshot: unknown): void
}

/**
 * Seam over the driver runner, the AUT iframe, and the snapshot store the pin
 * command drives. Reached through the event manager and the app's own runner
 * singletons — never `window.Cypress`, which is the outer driver in
 * cypress-in-cypress. Component tests stub this object.
 */
export const tapPinSource = {
  getRunner (): PinRunner | undefined {
    try {
      return window.getEventManager?.().getCypress()?.runner
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

  // Reflect the pin in the snapshot store so the reporter's hover machinery
  // (which bails while `isSnapshotPinned`) can't clobber the pinned DOM.
  setPinned (pinned: boolean): void {
    try {
      useSnapshotStore().setSnapshotPinned(pinned)
    } catch {
      // No store in this context — nothing to reflect.
    }
  },
}
