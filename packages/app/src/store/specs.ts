import type { BaseSpec } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  currentSpec: BaseSpec | null
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      currentSpec: null,
    }
  },

  actions: {
    async setCurrentSpec (currentSpec: BaseSpec) {
      this.currentSpec = currentSpec
    },
  },
})
