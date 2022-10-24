import type { BannersState, BannerState } from '@packages/types'
import { defineStore } from 'pinia'
import { sortBy } from 'lodash'

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
    isNotAuthorized: boolean
    isNotFound: boolean
  }
  userData?: LoginUserData
  promptsShown: {
    orchestration1?: number
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
        hasNonExampleSpec: false,
        isNotAuthorized: false,
        isNotFound: false,
      },
      promptsShown: {},
      bannersState: {},
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
  },
  getters: {
    userStatus (state): UserStatus {
      const { user, project } = state
      let userStatus: UserStatus

      switch (true) {
        // the switch here ensures the uniqueness of states as we don't allow duplicate case labels
        // https://eslint.org/docs/latest/rules/no-duplicate-case
        case !user.isLoggedIn:
          userStatus = 'isLoggedOut'
          break
        case user.isLoggedIn && user.isOrganizationLoaded && !user.isMemberOfOrganization:
          userStatus = 'needsOrgConnect'
          break
        case user.isLoggedIn && user.isMemberOfOrganization && !project.isProjectConnected && project.isConfigLoaded:
          userStatus = 'needsProjectConnect'
          break
        case user.isLoggedIn && user.isMemberOfOrganization && project.isProjectConnected && project.hasNoRecordedRuns && project.hasNonExampleSpec && project.isConfigLoaded:
          userStatus = 'needsRecordedRun'
          break
        default:
          userStatus = 'allTasksCompleted'
      }

      return userStatus
    },
    userStatusMatches () {
      // casting here since ts seems to need a little extra help in this 'return a function from a getter' situation
      return (status: UserStatus) => this.userStatus as unknown as UserStatus === status
    },
    latestBannerShownTime (state) {
      if (state.bannersState) {
        const itemsWithLastShown = Object.values(state.bannersState)
        .filter((item) => {
          // filter out the non-object properties like `_disabled`, confirm lastShown exists
          return typeof item === 'object' && Boolean(item.lastShown)
        })

        if (!itemsWithLastShown.length) {
          return undefined
        }

        const sortedBannersState = sortBy(itemsWithLastShown, 'lastShown') as BannerState[]

        return sortedBannersState[sortedBannersState.length - 1].lastShown
      }

      return undefined
    },

  },
})

export type LoginConnectStore = ReturnType<typeof useLoginConnectStore>
