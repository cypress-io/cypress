import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'

export interface MainStoreState {
  navBarExpandedByUser: boolean
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
      navBarExpandedByUser: true,
    }
  },
  actions: {
    toggleNavBar () {
      this.navBarExpandedByUser = !this.navBarExpandedByUser
    },
    setNavBarExpandedByUser (value: boolean) {
      this.navBarExpandedByUser = value
    },
  },
  getters: {
    navBarExpanded: (state) => {
      const route = useRoute()

      return state.navBarExpandedByUser && route.meta?.navBarExpandedAllowed !== false
    },
  },
})
