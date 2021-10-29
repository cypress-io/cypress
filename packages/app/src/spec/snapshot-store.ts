import { defineStore } from 'pinia'
import type { AutSnapshot } from '../runner/iframe-model'
import type { AutIframe } from '../runner/aut-iframe'

export type SnapshotMessageType = 'info' | 'warning' | 'pinned'

interface SnapshotStoreState {
  messageTitle?: string
  messageDescription?: 'pinned' | string
  messageType?: SnapshotMessageType
  snapshotProps?: AutSnapshot
  isSnapshotPinned: boolean
  snapshot?: {
    showingHighlights: boolean
    stateIndex: number
  }
}

export const useSnapshotStore = defineStore({
  id: 'snapshots',
  state: (): SnapshotStoreState => {
    return {
      messageTitle: undefined,
      messageDescription: undefined,
      isSnapshotPinned: false,
      snapshot: undefined,
      snapshotProps: undefined,
    }
  },
  actions: {
    setSnapshotPinned (isSnapshotPinned: boolean) {
      this.isSnapshotPinned = isSnapshotPinned
    },

    pinSnapshot (snapshotProps: AutSnapshot) {
      this.messageTitle = 'DOM Snapshot'
      this.messageDescription = 'pinned'
      this.messageType = 'info'
      this.isSnapshotPinned = true
      this.snapshotProps = snapshotProps
      this.snapshot = {
        showingHighlights: true,
        stateIndex: 0,
      }
    },

    clearMessage () {
      this.messageTitle = undefined
      this.messageDescription = undefined
      this.messageType = undefined
    },

    unpinSnapshot () {
      this.isSnapshotPinned = false
      this.messageTitle = 'DOM Snapshot'
      this.messageDescription = undefined
    },

    showSnapshot (messageDescription?: string) {
      this.messageTitle = 'DOM Snapshot'
      this.messageDescription = messageDescription
      this.messageType = undefined
    },

    toggleHighlights (autIframe: AutIframe) {
      if (!this.snapshot) {
        return
      }

      this.snapshot.showingHighlights = !this.snapshot.showingHighlights
      this.updateHighlighting(autIframe)
    },

    updateHighlighting (autIframe: AutIframe) {
      if (!this.snapshot) {
        throw Error('Cannot update highlighting if this.snapshot not defined')
      }

      if (this.snapshot.showingHighlights && this.snapshotProps) {
        const snapshot = this.snapshotProps.snapshots[this.snapshot.stateIndex]

        autIframe.highlightEl(snapshot, this.snapshotProps)
      } else {
        autIframe.removeHighlights()
      }
    },

    changeState (index: number, autIframe: AutIframe) {
      if (!this.snapshot) {
        throw Error('Cannot change state without first assigning this.snapshot')
      }

      const snapshot = this.snapshotProps?.snapshots[index]

      if (!snapshot) {
        throw Error(`Could not find snapshot index ${index}`)
      }

      this.snapshot.stateIndex = index

      autIframe.restoreDom(snapshot)

      this.updateHighlighting(autIframe)
    },

    setTestsRunningError () {
      this.messageTitle = 'Cannot show Snapshot while tests are running'
      this.messageType = 'warning'
    },

    setMessage (messageTitle: string, messageType: SnapshotMessageType) {
      this.messageTitle = messageTitle
      this.messageType = messageType
    },

    setMissingSnapshotMessage () {
      this.messageTitle = 'The snapshot is missing. Displaying current state of the DOM.'
      this.messageDescription = undefined
      this.messageType = 'warning'
    },
  },
})
