import { defineStore } from 'pinia'

/**
 * Store for reactive properties used in the runner UI.
 * Examples:
 * - modals to show (select preferred editor modal)
 * - sizing of resizable panes
 * - whether to show the spec list
 * ...
 */
export interface RunnerUiState {
  showChooseExternalEditorModal: boolean
  autoScrollingEnabled: boolean
  isSpecsListOpen: boolean
  specListWidth: number
  reporterWidth: number
}

export const useRunnerUiStore = defineStore({
  id: 'runner-ui',

  state (): RunnerUiState {
    return {
      showChooseExternalEditorModal: false,
      autoScrollingEnabled: true,
      isSpecsListOpen: true,
      specListWidth: 280,
      reporterWidth: 320,
    }
  },

  actions: {
    setShowChooseExternalEditorModal (value: boolean) {
      this.showChooseExternalEditorModal = value
    },
    setPreference<K extends keyof RunnerUiState> (preference: K, value: RunnerUiState[K]) {
      this.$state[preference] = value
    },
  },
})
