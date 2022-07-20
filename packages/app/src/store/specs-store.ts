import type { SpecFile } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: SpecFile | null | undefined
  activeSpecs: Array<SpecFile> | []
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: undefined,
      activeSpecs: [],
    }
  },

  actions: {
    setActiveSpec (activeSpec: SpecFile | null) {
      console.log('trying to set active spec')
      this.activeSpec = activeSpec
    },
    setActiveSpecs (activeSpecs: Array<SpecFile> | []) {
      console.log('trying to set active specs')
      this.activeSpecs = activeSpecs
    },
  },
})
