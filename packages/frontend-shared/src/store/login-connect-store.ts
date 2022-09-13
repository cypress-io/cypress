import { defineStore } from 'pinia'

export interface LoginConnectState {
  isLoginConnectOpen: boolean
  utmMedium: string
  isLoggedIn: boolean
  isProjectConnected: boolean
  isOrganizationLoaded: boolean
  isMemberOfOrganization: boolean
  hasNoRecordedRuns: boolean
  error: boolean
}

export type UserStatus = 'isLoggedOut' | 'needsOrgConnect' | 'needsProjectConnect' | 'needsRecordedRun' | 'noActionableState'

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
      hasNoRecordedRuns: false,
      error: false,
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
    setStatus (name: 'isLoggedIn' | 'isProjectConnected', newVal: boolean) {
      this[name] = newVal
    },
  },
  getters: {
    userStatus (state) {
      switch (true) {
        // the switch here ensures the uniqueness of states as we don't allow duplicate case labels
        // https://eslint.org/docs/latest/rules/no-duplicate-case
        case !state.isLoggedIn:
          return 'isLoggedOut'
        case state.isLoggedIn && state.isOrganizationLoaded && !state.isMemberOfOrganization:
          return 'needsOrgConnect'
        case state.isLoggedIn && state.isMemberOfOrganization && !state.isProjectConnected:
          return 'needsProjectConnect'
        case state.isLoggedIn && state.isMemberOfOrganization && state.isProjectConnected && state.hasNoRecordedRuns:
          return 'needsRecordedRun'
        default:
          return 'noActionableState'
      }
    },
    userStatusMatches () {
      return (status: UserStatus) => this.userStatus === status
    },
  },
})
