import { cloneDeep } from 'lodash'
import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { WizardStep, NavItem, Project, Browser, WizardBundler, WizardFrontendFramework, TestingTypeEnum } from '../generated/test-graphql-types.gen'
import { resetTestNodeIdx, testNodeId } from './clientTestUtils'
import * as cloudTypes from './stubgql-CloudTypes'
import { stubNavigationMenu } from './stubgql-NavigationMenu'
import { createTestProject } from './stubgql-Project'
import { longBrowsersList } from './stubgql-App'
import { allBundlers } from './stubgql-Wizard'

export interface ClientTestContext {
  app: {
    navItem: NavItem
    selectedBrowser: Browser | null
    browsers: Browser[] | null
    projects: Project[]
    activeProject: Project | null
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
  const browsers = longBrowsersList.map((browser, i): Browser => {
    return {
      ...testNodeId('Browser'),
      ...browser,
      disabled: false,
      isSelected: i === 0,
    }
  })

  const testProject = createTestProject('test-project')

  return {
    app: {
      navItem: 'settings',
      browsers,
      projects: [testProject, createTestProject('another-test-project')],
      selectedBrowser: browsers[0],
      activeProject: testProject,
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
    },
    user: null,
    cloudTypes,
    navigationMenu: cloneDeep(stubNavigationMenu),
    __mockPartial: {},
  }
}
