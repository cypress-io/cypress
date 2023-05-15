import _ from 'lodash'
import config from '../../fixtures/config.json'
import data from '../../fixtures/TestCurrentProject.json'

import type {
  CurrentProject,
  GlobalProject,
  Spec,
} from '../generated/test-graphql-types.gen'
import { testNodeId } from './clientTestUtils'
import { CloudProjectStubs } from '@packages/graphql/test/stubCloudTypes'
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
    savedState: {},
    isCTConfigured: true,
    serveConfig: {},
    isE2EConfigured: true,
    currentTestingType: 'e2e',
    projectId: `${globalProject.title}-id`,
    defaultSpecFileName: 'cypress/e2e/spec.cy.js',
    specs: [
      ...(data as Spec[]).map((c) => {
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
    },
    activeBrowser: stubBrowsers[0],
    browsers: stubBrowsers,
    isDefaultSpecPattern: true,
    browserStatus: 'closed',
    packageManager: 'yarn',
    configFileAbsolutePath: '/path/to/cypress.config.js',
    ...currentProject,
  }
}

export const stubProject: CurrentProject = createTestCurrentProject('Some Test Title')

export const stubGlobalProject: GlobalProject = createTestGlobalProject('Some Test Title')
