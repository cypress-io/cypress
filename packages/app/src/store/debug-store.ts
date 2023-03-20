import { defineStore } from 'pinia'

interface SelectedRun {
  runNumber: number
  sha: string
}

interface DebugStoreState {
  selectedRun?: SelectedRun
  locked: boolean
}

export const useDebugStore = defineStore({
  id: 'debug',
  state: (): DebugStoreState => {
    return {
      selectedRun: undefined,
      locked: false,
    }
  },

  actions: {
    setSelectedRun (run: SelectedRun | undefined) {
      this.selectedRun = run
    },

    lockSelectedRunNumber () {
      this.locked = true
    },

    unlockSelectedRunNumber () {
      this.locked = false
    },
  },
})
