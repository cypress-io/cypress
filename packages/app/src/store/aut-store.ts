import { defineStore } from 'pinia'

export type ScriptError = { type: string, error: string } | null

interface AutStoreState {
  url: string | undefined
  highlightUrl: boolean
  viewportWidth: number
  viewportHeight: number
  defaultViewportHeight: number
  defaultViewportWidth: number
  isLoadingUrl: boolean
  isLoading: boolean
  isRunning: boolean
  scriptError: ScriptError
  viewportUpdateCallback: (() => void) | null
  scale: number
  specRunnerHeaderHeight: number
}

export const useAutStore = defineStore({
  id: 'aut-store',
  state: (): AutStoreState => {
    const defaultViewportHeight = window.__CYPRESS_TESTING_TYPE__ === 'e2e' ? 660 : 500
    const defaultViewportWidth = window.__CYPRESS_TESTING_TYPE__ === 'e2e' ? 1000 : 500

    // TODO(lachlan): depends on CT or E2E, should seed accordingly using `config`
    return {
      isLoadingUrl: false,
      highlightUrl: false,
      url: undefined,
      viewportHeight: defaultViewportHeight,
      viewportWidth: defaultViewportWidth,
      defaultViewportHeight,
      defaultViewportWidth,
      isLoading: false,
      isRunning: false,
      viewportUpdateCallback: null,
      scriptError: null,
      scale: 1,
      specRunnerHeaderHeight: 64,
    }
  },

  actions: {
    setHighlightUrl (highlightUrl: boolean) {
      this.highlightUrl = highlightUrl
    },

    updateUrl (url?: string) {
      this.url = url
    },

    updateDimensions (viewportWidth: number, viewportHeight: number) {
      this.viewportHeight = viewportHeight
      this.viewportWidth = viewportWidth
    },

    setViewportUpdatedCallback (cb: () => void) {
      this.viewportUpdateCallback = cb
    },

    setIsLoadingUrl (isLoadingUrl: boolean) {
      this.isLoadingUrl = isLoadingUrl
    },

    setIsRunning (isRunning: boolean) {
      this.isRunning = isRunning
    },

    setIsLoading (isLoading: boolean) {
      this.isLoading = isLoading
    },

    resetUrl () {
      this.url = undefined
      this.highlightUrl = false
      this.isLoadingUrl = false
    },

    setScriptError (err: ScriptError) {
      this.scriptError = err
    },

    setScale (scale: number) {
      this.scale = scale
    },

    setSpecRunnerHeaderHeight (height: number) {
      this.specRunnerHeaderHeight = height
    },
  },

  getters: {
    viewportDimensions (state) {
      return {
        height: state.viewportHeight,
        width: state.viewportWidth,
      }
    },
  },
})
