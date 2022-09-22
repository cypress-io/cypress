import { defineStore } from 'pinia'

interface LoginUserData {
  fullName: string | null
  email: string | null
}

export interface LoginConnectState {
  isLoginConnectOpen: boolean
  utmMedium: string
  isLoggedIn: boolean
  isProjectConnected: boolean
  isOrganizationLoaded: boolean
  isMemberOfOrganization: boolean
  hasRecordedRuns: boolean
  loginError: boolean
  userData?: LoginUserData
}

type StatusField = 'isLoggedIn' | 'isProjectConnected' | 'isOrganizationLoaded' | 'isMemberOfOrganization' | 'hasRecordedRuns'

export const useLoginConnectStore = defineStore({
  id: 'loginConnect',

  state (): LoginConnectState {
    return {
      isLoginConnectOpen: false,
      utmMedium: '',
      isLoggedIn: false,
      isProjectConnected: false,
      isOrganizationLoaded: false,
      isMemberOfOrganization: false,
      hasRecordedRuns: false,
      loginError: false,
      userData: undefined,
    }
  },

  actions: {
    openLoginConnectModal ({ utmMedium }: { utmMedium: string }) {
      this.isLoginConnectOpen = true
      // TODO: type for all valid utm_medium values?
      this.utmMedium = utmMedium
    },
    closeLoginConnectModal () {
      this.isLoginConnectOpen = false
      this.utmMedium = ''
    },
    setStatus (name: StatusField, newVal: boolean) {
      this[name] = newVal
    },
    setLoginError (error) {
      this.loginError = error
    },
    setUserData (userData?: LoginUserData) {
      this.userData = userData
    },
  },
})
