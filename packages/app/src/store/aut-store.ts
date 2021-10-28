import { defineStore } from 'pinia'

interface AutStoreState {
  highlightUrl: boolean
  url?: string
}

export const useAutStore = defineStore({
  id: 'aut-store',
  state: (): AutStoreState => {
    return {
      highlightUrl: false,
    }
  },
  actions: {
    setHighlightUrl (highlightUrl: boolean) {
      this.highlightUrl = highlightUrl
    },
    updateUrl (url?: string) {
      this.url = url
    },
  },
})
