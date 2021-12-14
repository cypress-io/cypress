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
  autoScrollingEnabled: boolean
  isSpecsListOpen: boolean
  specListWidth: number
  reporterWidth: number
}

export const useRunnerUiStore = defineStore({
  id: 'runner-ui',

  state (): RunnerUiStore {
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
    setPreference (preference: string, value: boolean) {
      this[preference] = value
    },
  },
})
