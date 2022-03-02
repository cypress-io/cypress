import { defineStore } from 'pinia'

export type ScriptError = { type: string, error: string } | null

interface AutStoreState {
  url?: string
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
}

export const viewportDefaults = {
  e2e: {
    viewportHeight: 660,
    viewportWidth: 1000,
  },
  component: {
    viewportHeight: 500,
    viewportWidth: 500,
  },
} as const

export const useAutStore = defineStore({
  id: 'aut-store',
  state: (): AutStoreState => {
    const defaultViewportHeight = viewportDefaults[window.__CYPRESS_TESTING_TYPE__].viewportHeight
    const defaultViewportWidth = viewportDefaults[window.__CYPRESS_TESTING_TYPE__].viewportWidth

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
    setScale (scale) {
      this.scale = scale
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
