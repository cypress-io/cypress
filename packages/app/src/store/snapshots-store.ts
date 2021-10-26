import { defineStore } from 'pinia'

export interface SnapshotsStore {
  visible: boolean
}

/**
 * Modals Store allows parts of the application to open and close modals in
 * unrelated parts of the application. This is useful for resolving
 * conflicts between timing-based and interaction-based triggers (like the
 * Growth Modals and the Create Spec modals)
 */
export const useSnapshotsStore = defineStore({
  id: 'snapshots',
  state: (): SnapshotsStore => {
    return {
      visible: false,
    }
  },
  actions: {
    setVisible (visible: boolean) {
      this.visible = visible
    },
  },
})
