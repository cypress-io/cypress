import { cloneDeep } from 'lodash'
import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { WizardStep, NavItem, CurrentProject, Browser, WizardBundler, WizardFrontendFramework, TestingTypeEnum, GlobalProject } from '../generated/test-graphql-types.gen'
import { resetTestNodeIdx } from './clientTestUtils'
import { stubBrowsers } from './stubgql-Browser'
import * as cloudTypes from './stubgql-CloudTypes'
import { stubNavigationMenu } from './stubgql-NavigationMenu'
import { createTestCurrentProject, createTestGlobalProject, stubGlobalProject } from './stubgql-Project'
import { allBundlers } from './stubgql-Wizard'

export interface ClientTestContext {
  currentProject: CurrentProject | null
  projects: GlobalProject[]
  app: {
    navItem: NavItem
    currentBrowser: Browser | null
    browsers: Browser[] | null
    isInGlobalMode: boolean
    isAuthBrowserOpened: boolean
  }
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
  navigationMenu: typeof stubNavigationMenu
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
      navItem: 'settings',
      browsers: stubBrowsers,
      currentBrowser: stubBrowsers[0],
      isInGlobalMode: false,
      isAuthBrowserOpened: false,
    },
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
    navigationMenu: cloneDeep(stubNavigationMenu),
    __mockPartial: {},
  }
}
