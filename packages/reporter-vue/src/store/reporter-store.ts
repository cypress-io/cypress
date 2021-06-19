import { defineStore } from 'pinia'

export type ReporterState = 'idle' | 'running' | 'stopped' | 'paused'

export interface ReporterStore {
  state: ReporterState
  autoScrolling: boolean
}

export const useReporterStore = defineStore({
  id: 'reporter',
  state (): ReporterStore {
    return {
      state: 'idle',
      autoScrolling: false
    }
  },
  actions: {
    rerun() {
      this.state = 'idle'
    },
    stopRunning() {
      this.state = 'stopped'
    },
    toggleAutoScrolling() {
      this.autoScrolling = !this.autoScrolling
    }
  },
  getters: {
  }
})
