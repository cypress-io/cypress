// TODO: remove this if unused

import { defineStore } from 'pinia'

export interface RunnerStoreState {
  isSpecListShown: boolean
}

export const useRunnerStore = defineStore({
  id: 'runner',
  state: (): RunnerStoreState => {
    return {
      isSpecListShown: true,
    }
  },
  actions: {
    toggleSpecList () {
      this.isSpecListShown = !this.isSpecListShown
    },
  },
})
