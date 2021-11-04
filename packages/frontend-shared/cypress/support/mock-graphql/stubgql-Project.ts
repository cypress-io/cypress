import _ from 'lodash'
import { randomComponents } from './testStubSpecs'
import config from '../../fixtures/config.json'

import type {
  CurrentProject,
  GlobalProject,
} from '../generated/test-graphql-types.gen'
import { testNodeId } from './clientTestUtils'
import { CloudProjectStubs } from './stubgql-CloudTypes'

export const createTestGlobalProject = (title: string, additionalConfig: Partial<GlobalProject> = {}): GlobalProject => {
  const snakeTitle = _.kebabCase(title)

  return {
    ...testNodeId('GlobalProject'),
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
    isRefreshingBrowsers: false,
    isCTConfigured: true,
    isE2EConfigured: true,
    projectId: `${globalProject.title}-id`,
    specs: {
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
      },
      __typename: 'SpecConnection' as const,
      edges: [
        ...randomComponents(200).map((c) => {
          return {
            __typename: 'SpecEdge' as const,
            cursor: 'eoifjew',
            node: {
              id: c.absolute,
              __typename: 'Spec' as const,
              ...c,
            },
          }
        }),
      ],
    },
    config,
    cloudProject: CloudProjectStubs.componentProject,
    codeGenGlob: '/**/*.vue',
    ...currentProject,
  }
}

export const stubProject: CurrentProject = createTestCurrentProject('Some Test Title')

export const stubGlobalProject: GlobalProject = createTestGlobalProject('Some Test Title')
