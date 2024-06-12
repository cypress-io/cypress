import type { BannersState } from '@packages/types'
import { defineStore } from 'pinia'

interface LoginUserData {
  id: string
  fullName: string | null
  email: string | null
}

export interface UserProjectStatusState {
  hasInitiallyLoaded: boolean
  isLoginConnectOpen: boolean
  utmMedium: string
  utmContent?: string
  cypressFirstOpened?: number
  testingType?: 'e2e' | 'component'
  projectId?: string
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
    isCTConfigured: boolean
    hasDetectedCtFramework: boolean
    isUsingGit: boolean
  }
  userData?: LoginUserData
  promptsShown: {
    ci1?: number
    loginModalRecord?: number
  }
  bannersState: BannersState
  _latestBannerShownTimeForTesting?: number
}

export const CLOUD_STATUSES = [
  'isLoggedOut',
  'needsOrgConnect',
  'needsProjectConnect',
  'needsRecordedRun',
  'allTasksCompleted',
] as const

export const PROJECT_STATUSES = [
  'isComponentTestingCandidate',
  'allTasksCompleted',
] as const

export type CloudStatus = typeof CLOUD_STATUSES[number]

export type ProjectStatus = typeof PROJECT_STATUSES[number]

export const useUserProjectStatusStore = defineStore({
  id: 'userProjectStatus',

  state (): UserProjectStatusState {
    return {
      hasInitiallyLoaded: false,
      utmMedium: '',
      utmContent: undefined,
      isLoginConnectOpen: false,
      cypressFirstOpened: undefined,
      userData: undefined,
      testingType: undefined,
      projectId: undefined,
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
        isCTConfigured: false,
        hasDetectedCtFramework: false,
        isUsingGit: false,
      },
      promptsShown: {},
      bannersState: {},
      _latestBannerShownTimeForTesting: undefined,
    }
  },
  actions: {
    setHasInitiallyLoaded () {
      this.hasInitiallyLoaded = true
    },
    openLoginConnectModal ({ utmMedium, utmContent }: { utmMedium: string, utmContent?: string }) {
      this.isLoginConnectOpen = true
      this.utmMedium = utmMedium
      this.utmContent = utmContent
    },
    closeLoginConnectModal () {
      this.isLoginConnectOpen = false
      this.utmMedium = ''
      this.utmContent = undefined
    },
    setUserFlag (name: keyof UserProjectStatusState['user'], newVal: boolean) {
      this.user[name] = newVal
    },
    setProjectFlag (name: keyof UserProjectStatusState['project'], newVal: boolean) {
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
    setTestingType (testingType: 'e2e' | 'component' | undefined) {
      this.testingType = testingType
    },
    setProjectId (projectId: string | undefined) {
      this.projectId = projectId
    },
    setBannersState (banners: BannersState) {
      this.bannersState = banners
    },
    setLatestBannerShownTime (timestamp: number) {
      this._latestBannerShownTimeForTesting = timestamp
    },
  },
  getters: {
    cloudStatus (state): CloudStatus {
      const { user, project } = state

      switch (true) {
        // the switch here ensures the uniqueness of states as we don't allow duplicate case labels
        // https://eslint.org/docs/latest/rules/no-duplicate-case
        case !user.isLoggedIn:
          return 'isLoggedOut'
        case user.isLoggedIn && user.isOrganizationLoaded && !user.isMemberOfOrganization:
          return 'needsOrgConnect'
        case user.isLoggedIn && user.isMemberOfOrganization && !project.isProjectConnected && project.isConfigLoaded:
          return 'needsProjectConnect'
        case user.isLoggedIn && user.isMemberOfOrganization && project.isProjectConnected && project.hasNoRecordedRuns && project.hasNonExampleSpec && project.isConfigLoaded:
          return 'needsRecordedRun'
        default:
          return 'allTasksCompleted'
      }
    },
    projectStatus (state): ProjectStatus {
      const { project } = state

      if (state.testingType === 'e2e' && !project.isCTConfigured && project.hasDetectedCtFramework) {
        return 'isComponentTestingCandidate'
      }

      return 'allTasksCompleted'
    },
    cloudStatusMatches () {
      return (status: CloudStatus) => this.cloudStatus === status
    },
    projectStatusMatches () {
      return (status: ProjectStatus) => this.projectStatus === status
    },
    latestBannerShownTime (state) {
      return state._latestBannerShownTimeForTesting
      // TODO: in #23768 return based on bannersState - this will be used to delay the nav CI prompt if a banner was recently shown
    },

  },
})

export type UserProjectStatusStore = ReturnType<typeof useUserProjectStatusStore>
