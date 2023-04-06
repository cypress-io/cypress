import type { SpecFile, TestFilter } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: SpecFile | null | undefined
  specFilter?: string
  testFilter: TestFilter
}

export const useSpecStore = defineStore({
  id: 'spec',
  state (): SpecState {
    return {
      activeSpec: undefined,
      specFilter: undefined,
      testFilter: undefined,
    }
  },

  actions: {
    setActiveSpec (activeSpec: SpecFile | null) {
      this.activeSpec = activeSpec
    },
    setSpecFilter (filter: string) {
      this.specFilter = filter
    },
    setTestFilter (filter: SpecState['testFilter']) {
      this.testFilter = filter
    },
  },
})
