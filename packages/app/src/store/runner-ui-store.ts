import { defineStore } from 'pinia'

/**
 * Store for reactive properties used in the runner UI.
 * Examples:
 * - modals to show (select preferred editor modal)
 * - sizing of resizable panes
 * - whether to show the spec list
 * ...
 */
export interface RunnerUiStore {
  showChooseExternalEditorModal: boolean
}

export const useRunnerUiStore = defineStore({
  id: 'runner-ui',

  state (): RunnerUiStore {
    return {
      showChooseExternalEditorModal: false
    }
  },

  actions: {
    setShowChooseExternalEditorModal (value: boolean) {
      this.showChooseExternalEditorModal = value
    }
  },
})
