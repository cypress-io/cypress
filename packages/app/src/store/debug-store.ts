import { defineStore } from 'pinia'

interface DebugStoreState {
  selectedRunNumber?: string
  locked: boolean
}

export const useDebugStore = defineStore({
  id: 'debug',
  state: (): DebugStoreState => {
    return {
      selectedRunNumber: undefined,
      locked: false,
    }
  },

  actions: {
    setSelectedRunNumber (runNumber: string) {
      this.selectedRunNumber = runNumber
    },

    lockSelectedRunNumber () {
      this.locked = true
    },

    unlockSelectedRunNumber () {
      this.locked = false
    },
  },
})
