import _ from 'lodash'
import { randomComponents } from './testStubSpecs'
import config from '../../fixtures/config.json'

import type {
  CurrentProject,
  GlobalProject,
} from '../generated/test-graphql-types.gen'
import { testNodeId } from './clientTestUtils'
import { CloudProjectStubs } from './stubgql-CloudTypes'
import { stubBrowsers } from './stubgql-Browser'

export const createTestGlobalProject = (title: string, additionalConfig: Partial<GlobalProject> = {}): GlobalProject => {
  const snakeTitle = _.kebabCase(title)

  return {
    ...testNodeId('GlobalProject', snakeTitle),
    __typename: 'GlobalProject',
    projectRoot: `/usr/local/dev/projects/${snakeTitle}`,
    title: snakeTitle,
    ...additionalConfig,
  }
}

export const createTestCurrentProject = (title: string, currentProject: Partial<CurrentProject> = {}): CurrentProject => {
  const globalProject = createTestGlobalProject(title)

  return {
    ...globalProject,
    __typename: 'CurrentProject',
    isCTConfigured: true,
    isE2EConfigured: true,
    currentTestingType: 'e2e',
    projectId: `${globalProject.title}-id`,
    specs: [
      ...randomComponents(200, 'Spec').map((c) => {
        return {
          ...c,
          id: c.absolute,
        }
      }),
    ],
    config,
    cloudProject: CloudProjectStubs.componentProject,
    codeGenGlobs: {
      id: 'super-unique-id',
      __typename: 'CodeGenGlobs',
      component: '**/*.vue',
      story: '**/*.stories.*',
    },
    currentBrowser: stubBrowsers[0],
    browsers: stubBrowsers,
    isDefaultSpecPattern: true,
    isBrowserOpen: false,
    packageManager: 'yarn',
    ...currentProject,
  }
}

export const stubProject: CurrentProject = createTestCurrentProject('Some Test Title')

export const stubGlobalProject: GlobalProject = createTestGlobalProject('Some Test Title')
