import { defineStore } from 'pinia'
import type { AutSnapshot } from './iframe-model'
import type { AutIframe } from './aut-iframe'
// tslint:disable-next-line: no-implicit-dependencies - unsure how to handle these
import { defaultMessages } from '@cy/i18n'

interface SnapshotStoreState {
  messageTitle?: string
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
      this.messageTitle = defaultMessages.runner.snapshot.pinnedTitle
      this.isSnapshotPinned = true
      this.snapshotProps = snapshotProps
      this.snapshot = {
        showingHighlights: true,
        stateIndex: 0,
      }
    },

    clearMessage () {
      this.messageTitle = undefined
    },

    unpinSnapshot () {
      this.$reset()
    },

    showSnapshot (messageDescription: string = defaultMessages.runner.snapshot.defaultTitle) {
      this.messageTitle = messageDescription
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
      this.messageTitle = defaultMessages.runner.snapshot.testsRunningError
    },

    setMessage (messageTitle: string) {
      this.messageTitle = messageTitle
    },

    setMissingSnapshotMessage () {
      this.messageTitle = defaultMessages.runner.snapshot.snapshotMissingError
    },
  },
})
