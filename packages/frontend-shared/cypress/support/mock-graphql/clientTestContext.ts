import { cloneDeep } from 'lodash'
import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { NavItem, CurrentProject, Browser, WizardBundler, WizardFrontendFramework, GlobalProject } from '../generated/test-graphql-types.gen'
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
    chosenBundler: WizardBundler | null
    chosenFramework: WizardFrontendFramework | null
    chosenManualInstall: boolean
    allBundlers: WizardBundler[]
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
      chosenBundler: null,
      chosenFramework: null,
      chosenManualInstall: false,
      allBundlers,
      chosenBrowser: null,
    },
    user: null,
    cloudTypes,
    navigationMenu: cloneDeep(stubNavigationMenu),
    __mockPartial: {},
  }
}
