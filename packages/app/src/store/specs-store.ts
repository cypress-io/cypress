import type { BaseSpec } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: BaseSpec | null
  isRunnerInitialized: boolean
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: null,
      isRunnerInitialized: false,
    }
  },

  actions: {
    setActiveSpec (activeSpec: BaseSpec | null) {
      this.activeSpec = activeSpec
    },
    setIsRunnerInitialized (isRunnerInitialized: boolean) {
      this.isRunnerInitialized = isRunnerInitialized
    },
  },
})
