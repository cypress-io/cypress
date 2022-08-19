import { defineStore } from 'pinia'

type UserStatus = 'loggedOut' | 'notConnected' | 'needsAccess' | undefined

export interface LoginConnectState {
  userStatus: UserStatus
  isLoginConnectOpen: boolean
}

export const useLoginConnectStore = defineStore({
  id: 'loginConnect',

  state (): LoginConnectState {
    return {
      userStatus: undefined,
      isLoginConnectOpen: false,
    }
  },

  actions: {
    setUserStatus (state: UserStatus) {
      this.userStatus = state
    },
    setIsLoginConnectOpen (isOpen: boolean) {
      this.isLoginConnectOpen = isOpen
    },
  },
})
