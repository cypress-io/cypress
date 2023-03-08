import type { SpecFile, TestFilter } from '@packages/types/src'
import { defineStore } from 'pinia'

export interface SpecState {
  activeSpec: SpecFile | null | undefined
  lastPromise?: Promise<any>
  specFilter?: string
  testFilter: TestFilter
}

export const useSpecStore = defineStore({
  id: 'spec',
  state (): SpecState {
    return {
      activeSpec: undefined,
      lastPromise: undefined,
      specFilter: undefined,
      testFilter: undefined,
    }
  },

  actions: {
    getActiveSpec () {
      return this.activeSpec
    },

    setActiveSpec (activeSpec: SpecFile | null) {
      this.activeSpec = activeSpec
    },

    getLastPromise () {
      return this.lastPromise
    },

    setLastPromise (promise: Promise<any>) {
      this.lastPromise = promise
    },

    setSpecFilter (filter: string) {
      this.specFilter = filter
    },
    setTestFilter (filter: SpecState['testFilter']) {
      this.testFilter = filter
    },
  },
})
