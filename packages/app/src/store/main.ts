import { defineStore } from 'pinia'

export interface MainStoreState {
  navBarExpanded: boolean
}

/**
 * Main Store contains application UI state for components
 * whose state must be accessible regardless of their positions within the
 * component hierarchy.
 */
export const useMainStore = defineStore({
  id: 'main',
  state: () => ({ navBarExpanded: false }),
  actions: {
    toggleNavBar () {
      this.navBarExpanded = !this.navBarExpanded
    },
  },
})
