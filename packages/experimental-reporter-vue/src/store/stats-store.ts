import { defineStore } from 'pinia'
import { useStore } from './index'
import _, { defaults } from 'lodash'

export type StatType = 'pending' | 'passed' | 'failed'
export interface StatsStore {
  startTime: number,
  currentTime: number,
  raf: null

}

export const defaultStats = {
  startTime: 0,
  currentTime: 0,
  raf: null
}

export const useStatsStore = defineStore({
  id: 'stats',
  state (): StatsStore {
    return {
      ...defaultStats,
    }
  },
  actions: {
    start() {
      this.startTime = Date.now()
      this.currentTime = Date.now()

      const update = () => {
        this.currentTime = Date.now()
        this.raf = requestAnimationFrame(update);
      }

      update()
    },
    stop() {
      cancelAnimationFrame(this.raf)
    }
  },
  getters: {
    duration(store) {
      if (!store.startTime) return 0

      if (!store.currentTime) {
        throw new Error('StatsStore should be initialized with start() method.')
      }

      return store.currentTime - store.startTime
    },
    byType() {
      const store = useStore()
      const types = _.groupBy(store.tests, 'state')
      types.pending = types.pending || []
      types.passed = types.passed || []
      types.failed = types.failed || []
      return types
    }
  }
})
