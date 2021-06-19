import { defineStore } from 'pinia'

var globalID;

export type StatType = 'pending' | 'passed' | 'failed'
export interface StatsStore {
  numberOfFailed: number
  numberOfPassed: number
  numberOfPending: number
  startTime: number,
  currentTime: number,
  raf: null
}

// TODO: how do you "pick" or "partial"?
// export interface StatsStoreStartInfo {
//   startTime: StartTime,
//   numberOfFailed: number,
//   numberOfPassed: number,
//   numberOfPending: number,
// }

export const defaultStats = {
  startTime: 0,
  numberOfFailed: 0,
  numberOfPassed: 0,
  numberOfPending: 0,
  currentTime: 0,
  raf: null
}

export const useStatsStore = defineStore({
  id: 'stats',
  state (): StatsStore {
    return defaultStats
  },
  actions: {
    increment () {
      this.numberOfFailed++
    },
    start({
      startTime = defaultStats.startTime,
      numberOfPassed,
      numberOfFailed,
      numberOfPending }: Partial<StatsStore>) {
      this.numberOfFailed = numberOfFailed
      this.numberOfPassed = numberOfPassed
      this.numberOfPending = numberOfPending
      this.startTime = new Date(startTime).getTime()
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
    }
  }
})
