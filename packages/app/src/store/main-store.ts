import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'

export interface MainStoreState {
  navBarExpandedFlag: boolean
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
      navBarExpandedFlag: true,
    }
  },
  actions: {
    toggleNavBar () {
      this.navBarExpandedFlag = !this.navBarExpandedFlag
    },
  },
  getters: {
    navBarExpanded: (state) => {
      const route = useRoute()

      return state.navBarExpandedFlag && route.meta?.navBarExpanded !== false
    },
  },
})
