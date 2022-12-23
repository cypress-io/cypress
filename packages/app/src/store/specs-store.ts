import type { SpecFile } from '@packages/types/src'
import { defineStore } from 'pinia'

export type SpecWithFilter = SpecFile & { testFilter?: Cypress.Spec['testFilter'] }

export interface SpecState {
  activeSpec: SpecWithFilter | undefined | null
  specFilter?: string
}

export const useSpecStore = defineStore({
  id: 'spec',

  state (): SpecState {
    return {
      activeSpec: undefined,
      specFilter: undefined,
    }
  },

  actions: {
    setActiveSpec (activeSpec: SpecState['activeSpec']) {
      this.activeSpec = activeSpec
    },
    setSpecFilter (filter: string) {
      this.specFilter = filter
    },
  },
})
