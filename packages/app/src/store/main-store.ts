import { defineStore } from 'pinia'
import { useRoute } from 'vue-router'

export interface MainStoreState {
  _navBarExpanded: boolean
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
      _navBarExpanded: true,
    }
  },
  actions: {
    toggleNavBar () {
      this._navBarExpanded = !this._navBarExpanded
    },
  },
  getters: {
    navBarExpanded: (state) => {
      const route = useRoute()

      return state._navBarExpanded && route.meta?.navBarExpanded !== false
    },
  },
})
