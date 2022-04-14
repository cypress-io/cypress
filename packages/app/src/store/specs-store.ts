import type { SpecFile } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: SpecFile | null | undefined
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: undefined,
    }
  },

  actions: {
    setActiveSpec (activeSpec: SpecFile | null) {
      this.activeSpec = activeSpec
    },
  },
})
