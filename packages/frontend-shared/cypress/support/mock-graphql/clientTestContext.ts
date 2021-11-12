import type { CloudUser } from '../generated/test-cloud-graphql-types.gen'
import type { CurrentProject, Browser, GlobalProject } from '../generated/test-graphql-types.gen'
import { resetTestNodeIdx } from './clientTestUtils'
import { stubBrowsers } from './stubgql-Browser'
import * as cloudTypes from './stubgql-CloudTypes'
import { createTestCurrentProject, createTestGlobalProject, stubGlobalProject } from './stubgql-Project'

export interface ClientTestContext {
  currentProject: CurrentProject | null
  projects: GlobalProject[]
  app: {
    currentBrowser: Browser | null
    browsers: Browser[] | null
  }
  isAuthBrowserOpened: boolean
  wizard: {
    chosenManualInstall: boolean
    chosenBrowser: null
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
      chosenManualInstall: false,
      chosenBrowser: null,
    },
    user: null,
    cloudTypes,
    __mockPartial: {},
  }
}
