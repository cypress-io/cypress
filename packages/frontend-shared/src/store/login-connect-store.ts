import { defineStore } from 'pinia'

export interface LoginConnectState {
  isLoginConnectOpen: boolean
}

export const useLoginConnectStore = defineStore({
  id: 'loginConnect',

  state (): LoginConnectState {
    return {
      isLoginConnectOpen: false,
    }
  },

  actions: {
    setIsLoginConnectOpen (isOpen: boolean) {
      this.isLoginConnectOpen = isOpen
    },
  },
})
