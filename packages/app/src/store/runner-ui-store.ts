import { defineStore } from 'pinia'
import { runnerConstants } from '../runner/runner-constants'

export const automation = {
  CONNECTING: 'CONNECTING',
  MISSING: 'MISSING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
} as const

export type AutomationStatus = keyof typeof automation

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
  studioWidth: number
  automationStatus: AutomationStatus
  randomString: string
  hideCommandLog: boolean
  hideRunnerUi: boolean
}

export const useRunnerUiStore = defineStore({
  id: 'runner-ui',

  state (): RunnerUiState {
    return {
      showChooseExternalEditorModal: false,
      autoScrollingEnabled: true,
      isSpecsListOpen: false,
      specListWidth: runnerConstants.defaultSpecListWidth,
      reporterWidth: runnerConstants.defaultReporterWidth,
      studioWidth: runnerConstants.defaultStudioWidth,
      automationStatus: automation.CONNECTING,
      randomString: `${Math.random()}`,
      hideCommandLog: window.__CYPRESS_CONFIG__.hideCommandLog,
      hideRunnerUi: window.__CYPRESS_CONFIG__.hideRunnerUi,
    }
  },

  actions: {
    setAutomationStatus (status: AutomationStatus) {
      this.automationStatus = status
    },

    setShowChooseExternalEditorModal (value: boolean) {
      this.showChooseExternalEditorModal = value
    },
    setPreference<K extends keyof RunnerUiState> (preference: K, value: RunnerUiState[K]) {
      this.$state[preference] = value
    },
  },
})
