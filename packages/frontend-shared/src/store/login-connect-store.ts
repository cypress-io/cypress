import type { BannersState } from '@packages/types'
import { defineStore } from 'pinia'

interface LoginUserData {
  fullName: string | null
  email: string | null
}

export interface LoginConnectState {
  isLoginConnectOpen: boolean
  utmMedium: string
  cypressFirstOpened?: number
  user: {
    isLoggedIn: boolean
    loginError: boolean
    isOrganizationLoaded: boolean
    isMemberOfOrganization: boolean
  }
  project: {
    isProjectConnected: boolean
    isConfigLoaded: boolean
    hasNoRecordedRuns: boolean
    hasNonExampleSpec: boolean
  }
  userData?: LoginUserData
  promptsShown: {
    ci1?: number
    loginModalRecord?: number
  }
  bannersState: BannersState
  _latestBannerShownTimeForTesting?: number
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

export const useLoginConnectStore = defineStore({
  id: 'loginConnect',

  state (): LoginConnectState {
    return {
      utmMedium: '',
      isLoginConnectOpen: false,
      cypressFirstOpened: undefined,
      userData: undefined,
      user: {
        isLoggedIn: false,
        loginError: false,
        isOrganizationLoaded: false,
        isMemberOfOrganization: false,
      },
      project: {
        isProjectConnected: false,
        isConfigLoaded: false,
        hasNoRecordedRuns: false,
        hasNonExampleSpec: true, // TODO: in #23762 initialize as false and set the real value
      },
      promptsShown: {},
      bannersState: {},
      _latestBannerShownTimeForTesting: undefined,
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
    setUserFlag (name: keyof LoginConnectState['user'], newVal: boolean) {
      this.user[name] = newVal
    },
    setProjectFlag (name: keyof LoginConnectState['project'], newVal: boolean) {
      this.project[name] = newVal
    },
    setLoginError (error: boolean) {
      this.user.loginError = error
    },
    setUserData (userData?: LoginUserData) {
      this.userData = userData
    },
    setPromptShown (slug: string, timestamp: number) {
      this.promptsShown[slug] = timestamp
    },
    setCypressFirstOpened (timestamp: number) {
      this.cypressFirstOpened = timestamp
    },
    setBannersState (banners: BannersState) {
      this.bannersState = banners
    },
    setLatestBannerShownTime (timestamp: number) {
      this._latestBannerShownTimeForTesting = timestamp
    },
  },
  getters: {
    userStatus (state): UserStatus {
      const { user, project } = state

      switch (true) {
        // the switch here ensures the uniqueness of states as we don't allow duplicate case labels
        // https://eslint.org/docs/latest/rules/no-duplicate-case
        case !user.isLoggedIn:
          return 'isLoggedOut'
        case user.isLoggedIn && user.isOrganizationLoaded && !user.isMemberOfOrganization:
          return 'needsOrgConnect'
        case user.isLoggedIn && user.isMemberOfOrganization && !project.isProjectConnected:
          return 'needsProjectConnect'
        case user.isLoggedIn && user.isMemberOfOrganization && project.isProjectConnected && project.hasNoRecordedRuns:
          return 'needsRecordedRun'
        default:
          return 'allTasksCompleted'
      }
    },
    userStatusMatches () {
      // casting here sine ts seems to need a little extra help in this 'return a function from a getter' situation
      return (status: UserStatus) => this.userStatus as unknown as UserStatus === status
    },
    projectStatus () {
      // TODO: in #23762 look at projectConnectionStatus in SpecHeaderCloudDataTooltip
    },
    latestBannerShownTime (state) {
      return state._latestBannerShownTimeForTesting
      // TODO: in #23762 return based on bannersState
    },

  },
})

export type LoginConnectStore = ReturnType<typeof useLoginConnectStore>
