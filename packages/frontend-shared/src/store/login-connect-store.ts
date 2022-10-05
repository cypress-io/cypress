import type { BannersState } from '@packages/types'
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
  isConfigLoaded: boolean
  isOrganizationLoaded: boolean
  isMemberOfOrganization: boolean
  hasNoRecordedRuns: boolean
  error: boolean
  hasRecordedRuns: boolean
  loginError: boolean
  userData?: LoginUserData
  firstOpened?: number
  latestBannerShownTime?: number
  hasNonExampleSpec: boolean
  promptsShown: {
    ci1?: number
    loginModalRecord?: number
  }
  bannersState: BannersState
}

// The user can be in only one status at a time.
// These are specifically related to the dashboard
// and the progress from logging in to recording a run.
export const userStatuses = [
  'isLoggedOut',
  'needsOrgConnect',
  'needsProjectConnect',
  'needsRecordedRun',
  'allTasksCompleted',
] as const

export type UserStatus = typeof userStatuses[number]

export type LoginConnectBooleanField = 'isLoggedIn' | 'isProjectConnected' | 'isConfigLoaded' | 'isOrganizationLoaded' | 'isMemberOfOrganization' | 'hasRecordedRuns' | 'hasNoRecordedRuns' | 'hasNonExampleSpec'

export const useLoginConnectStore = defineStore({
  id: 'loginConnect',

  state (): LoginConnectState {
    return {
      isLoginConnectOpen: false,
      utmMedium: '',
      isLoggedIn: false,
      isProjectConnected: false,
      isConfigLoaded: false,
      isOrganizationLoaded: false,
      isMemberOfOrganization: false,
      hasNoRecordedRuns: false,
      error: false,
      hasRecordedRuns: false,
      loginError: false,
      userData: undefined,
      hasNonExampleSpec: true, // TODO: in #23762 initialize as false and set the real value
      promptsShown: {},
      firstOpened: undefined,
      bannersState: {},
      latestBannerShownTime: undefined,
    }
  },
  actions: {
    openLoginConnectModal ({ utmMedium }: { utmMedium: string }) {
      this.isLoginConnectOpen = true
      this.utmMedium = utmMedium
    },
    closeLoginConnectModal () {
      this.isLoginConnectOpen = false
      this.utmMedium = ''
    },
    /**
     * Set a boolean flag in the LoginConnect store
     */
    setFlag (name: LoginConnectBooleanField, newVal: boolean) {
      this[name] = newVal
    },
    setLoginError (error: boolean) {
      this.loginError = error
    },
    setUserData (userData?: LoginUserData) {
      this.userData = userData
    },
    setPromptShown (slug: string, timestamp: number) {
      this.promptsShown[slug] = timestamp
    },
    setFirstOpened (timestamp: number) {
      this.firstOpened = timestamp
    },
    setBannersState (banners: BannersState) {
      this.bannersState = banners
    },
    setLatestBannerShownTime (timestamp: number) {
      this.latestBannerShownTime = timestamp
    },
  },
  getters: {
    userStatus (state): UserStatus {
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
          return 'allTasksCompleted'
      }
    },
    userStatusMatches () {
      return (status: UserStatus) => this.userStatus === status
    },
    userStatusIsNot () {
      return (status: UserStatus) => this.userStatus !== status
    },
    projectStatus () {
      // TODO: in #23762 look at projectConnectionStatus in SpecHeaderCloudDataTooltip
    },
  },
})

export type LoginConnectStore = ReturnType<typeof useLoginConnectStore>
