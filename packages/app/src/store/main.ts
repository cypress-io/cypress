import { defineStore } from 'pinia'

export interface MainStoreState {
  navBarExpanded: boolean
  highlightUrl: boolean
  url?: string
}

/**
 * Main Store contains application UI state for components
 * whose state must be accessible regardless of their positions within the
 * component hierarchy.
 */
export const useMainStore = defineStore({
  id: 'main',
  state: (): MainStoreState => {
    return {
      navBarExpanded: false,
      highlightUrl: false,
    }
  },
  actions: {
    toggleNavBar () {
      this.navBarExpanded = !this.navBarExpanded
    },
    setHighlightUrl (highlightUrl: boolean) {
      this.highlightUrl = highlightUrl
    },
    updateUrl (url?: string) {
      this.url = url
    },
  },
})
