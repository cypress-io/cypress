import { cloneDeep } from 'lodash'
import type { Bundler, BUNDLERS, FrontendFramework, TestingType } from '@packages/types'
import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { WizardStep, NavItem, Project, Browser } from '../generated/test-graphql-types.gen'
import { resetTestNodeIdx, testNodeId } from './clientTestUtils'
import * as cloudTypes from './stubgql-CloudTypes'
import { stubNavigationMenu } from './stubgql-NavigationMenu'
import { createTestProject } from './stubgql-Project'
import { longBrowsersList } from './stubgql-App'
import { stubWizard } from './stubgql-Wizard'

export interface ClientTestContext {
  app: {
    navItem: NavItem
    selectedBrowser: Browser | null
    browsers: Browser[] | null
    projects: Project[]
    activeProject: Project | null
    isInGlobalMode: boolean
  }
  wizard: {
    step: WizardStep
    canNavigateForward: boolean
    chosenTestingType: TestingType | null
    chosenBundler: Bundler | null
    chosenFramework: FrontendFramework | null
    chosenManualInstall: boolean
    currentStep: WizardStep
    allBundlers: typeof BUNDLERS
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
      projects: [testProject],
      selectedBrowser: browsers[0],
      activeProject: testProject,
      isInGlobalMode: false,
    },
    wizard: {
      step: 'createConfig',
      canNavigateForward: false,
      chosenTestingType: null,
      chosenBundler: null,
      chosenFramework: null,
      chosenManualInstall: false,
      currentStep: 'welcome',
      allBundlers: stubWizard.allBundlers as any,
      history: ['welcome'],
      chosenBrowser: null,
    },
    user: null,
    cloudTypes,
    navigationMenu: cloneDeep(stubNavigationMenu),
    __mockPartial: {},
  }
}
