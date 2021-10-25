import type { BaseSpec } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: BaseSpec | null
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: null,
    }
  },

  actions: {
    setActiveSpec (activeSpec: BaseSpec | null) {
      this.activeSpec = activeSpec
    },
  },
})
