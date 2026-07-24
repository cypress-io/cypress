import { gql } from '@urql/vue'
import type { Client } from '@urql/core'
import type { FoundSpec } from '@packages/types'

import { TapSpecsDocument } from '../generated/graphql'
import { posixify } from '../paths'
import { getAutIframeModel } from '../runner'
import { useSnapshotStore } from '../runner/snapshot-store'
import { useAutStore } from '../store'
import type { PinAutIframe, PinSnapshotProps, PinSnapshotRunner, RunnableSpec, TapTestsRunner } from './types'

gql`
query TapSpecs {
  currentProject {
    id
    specs {
      id
      relative
      gitInfo {
        lastModifiedHumanReadable
      }
    }
  }
}
`

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

      return {
        getAllTestsState: runner.getAllTestsState,
        getTestState: runner.getTestState,
        isRunComplete: () => em.runComplete,
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

  async getRunnableSpecs (gqlClient: Client | null): Promise<RunnableSpec[]> {
    if (gqlClient) {
      const result = await gqlClient.query(TapSpecsDocument, {}, { requestPolicy: 'network-only' }).toPromise()
      const specs = result.data?.currentProject?.specs

      if (specs) {
        return specs.map(({ relative, gitInfo }) => {
          return {
            relative,
            ...(gitInfo?.lastModifiedHumanReadable != null ? { lastModified: gitInfo.lastModifiedHumanReadable } : {}),
          }
        })
      }
    }

    return (window.__RUN_MODE_SPECS__ ?? []) as FoundSpec[]
  },

  getHash () {
    return window.location.hash
  },

  setHash (hash: string) {
    window.location.hash = hash
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

  pinSnapshot (props: PinSnapshotProps, index: number, testId: string, logId: string): void {
    eventManager()?.localBus.emit('pin:snapshot', props)

    if (index !== 0) {
      tapManagerDataSource.changeSnapshotState(index)
    }

    eventManager()?.snapshotPinned(testId, logId)
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
