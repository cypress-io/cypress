import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { WizardStep, CurrentProject, Browser, WizardBundler, WizardFrontendFramework, TestingTypeEnum, GlobalProject } from '../generated/test-graphql-types.gen'
import { resetTestNodeIdx } from './clientTestUtils'
import { stubBrowsers } from './stubgql-Browser'
import * as cloudTypes from './stubgql-CloudTypes'
import { createTestCurrentProject, createTestGlobalProject, stubGlobalProject } from './stubgql-Project'
import { allBundlers } from './stubgql-Wizard'

export interface ClientTestContext {
  currentProject: CurrentProject | null
  projects: GlobalProject[]
  app: {
    currentBrowser: Browser | null
    browsers: Browser[] | null
  }
  isAuthBrowserOpened: boolean
  wizard: {
    step: WizardStep
    canNavigateForward: boolean
    chosenTestingType: TestingTypeEnum | null
    chosenBundler: WizardBundler | null
    chosenFramework: WizardFrontendFramework | null
    chosenManualInstall: boolean
    currentStep: WizardStep
    allBundlers: WizardBundler[]
    history: WizardStep[]
    chosenBrowser: null
    browserErrorMessage: null
  }
  user: Partial<CloudUser> | null
  cloudTypes: typeof cloudTypes
  __mockPartial: any
}

/**
 * We create a new "context" per test, which we can use as a mutable state object
 * to manipulate resolvers
 */
export function makeClientTestContext (): ClientTestContext {
  resetTestNodeIdx()

  const testProject = createTestCurrentProject('test-project')

  return {
    currentProject: testProject,
    projects: [stubGlobalProject, createTestGlobalProject('another-test-project')],
    app: {
      browsers: stubBrowsers,
      currentBrowser: stubBrowsers[0],
    },
    isAuthBrowserOpened: false,
    wizard: {
      step: 'configFiles',
      canNavigateForward: false,
      chosenTestingType: null,
      chosenBundler: null,
      chosenFramework: null,
      chosenManualInstall: false,
      currentStep: 'welcome',
      allBundlers,
      history: ['welcome'],
      chosenBrowser: null,
      browserErrorMessage: null,
    },
    user: null,
    cloudTypes,
    __mockPartial: {},
  }
}
