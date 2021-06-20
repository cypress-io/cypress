import { defineStore } from 'pinia'
import { useRunnablesStore } from './runnables-store'
import { RootRunnable } from '../runnables/types'

export type ReporterState = 'idle' | 'running' | 'stopped' | 'paused'

export interface ReporterStore {
  state?: ReporterState
  autoScrolling?: boolean
  [key: string]: any;
}

export const useReporterStore = defineStore({
  id: 'reporter',
  state(): ReporterStore {
    const runnablesStore = useRunnablesStore()
    return {
      bus: null,
      runnablesStore,
    }
  },
  actions: {
    init() {
      this.bus.on('runnables:ready',
        (rootRunnable: RootRunnable) => {
          this.runnablesStore.rootRunnable = rootRunnable
        })
    },
    rerun() {
      // this.state = 'idle'
    },
    stopRunning() {
      // this.state = 'stopped'
    },
    toggleAutoScrolling() {
      // this.autoScrolling = !this.autoScrolling
    }
  },
  getters: {
  }
})
