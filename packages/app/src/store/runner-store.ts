import { defineStore } from 'pinia'

export interface RunnerStoreState {
  showSpecList: boolean
}

export const useRunnerStore = defineStore({
  id: 'runner',
  state: (): RunnerStoreState => {
    return {
      showSpecList: true,
    }
  },
  actions: {
    toggleSpecList () {
      this.showSpecList = !this.showSpecList
    },
  },
})
