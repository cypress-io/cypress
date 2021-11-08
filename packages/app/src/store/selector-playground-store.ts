import { defineStore } from 'pinia'

type SelectorMethod = 'get' | 'contains'

interface SelectorPlaygroundStore {
  show: boolean
  getSelector: string
  containsSelector: string
  isOpen: boolean
  isEnabled: boolean
  isShowingHighlight: boolean
  isValid: boolean
  numElements: number
  method: SelectorMethod
}

export const useSelectorPlaygroundStore = defineStore({
  id: 'selector-playground-store',

  state: (): SelectorPlaygroundStore => {
    return {
      show: false,
      getSelector: 'body',
      containsSelector: 'Hello, World',
      isOpen: false,
      isEnabled: false,
      isShowingHighlight: false,
      isValid: true,
      numElements: 0,
      method: 'contains'
    }
  },

  actions: {
    setShow (show: boolean) {
      this.show = show
    },

    toggleMethod () {
      this.method = this.method === 'get' ? 'contains' : 'get'
    },

    toggleEnabled () {
      this.setEnabled(!this.isEnabled)
    },

    setEnabled (isEnabled: boolean) {
      this.isEnabled = isEnabled

      if (!this.isEnabled) {
        this.isShowingHighlight = false
      }
    },

    toggleOpen () {
      this.setOpen(!this.isOpen)
    },

    setOpen (isOpen: boolean) {
      this.isOpen = isOpen

      this.setEnabled(this.isOpen)
    },

    setShowingHighlight (isShowingHighlight: boolean) {
      this.isShowingHighlight = isShowingHighlight
    },

    setSelector (selector: SelectorMethod) {
      if (this.method === 'get') {
        this.getSelector = selector
      } else {
        this.containsSelector = selector
      }
    },

    setNumElements (numElements: number) {
      this.numElements = numElements
    },

    setValidity (isValid: boolean) {
      this.isValid = isValid
    },

    setMethod (method: SelectorMethod) {
      this.method = method
    },

    resetMethod () {
      this.method = 'get'
    },
  },
  
  getters: {
    selector (state) {
      return state.method === 'get' ? state.getSelector : state.containsSelector
    },

    infoHelp (state) {
      if (!state.isValid) {
        return 'Invalid selector'
      }

      return state.numElements === 1 ? '1 matched element' : `${state.numElements} matched elements`
    }
  }
})
