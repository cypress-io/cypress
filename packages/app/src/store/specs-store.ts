import type { SpecFile } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: SpecFile | null | undefined
  specSetEvents: any[]
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: undefined,
      specSetEvents: [],
    }
  },

  actions: {
    setActiveSpec (activeSpec: SpecFile | null, message: string) {
      this.activeSpec = activeSpec
      this.specSetEvents.push(`${message} - ${activeSpec?.baseName || 'was null'}`)
    },
  },
})
