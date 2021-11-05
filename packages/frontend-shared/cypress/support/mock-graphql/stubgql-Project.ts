import _ from 'lodash'
import { randomComponents } from './testStubSpecs'
import config from '../../fixtures/config.json'

import type {
  Project,
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { MaybeResolver, testNodeId } from './clientTestUtils'
import { CloudProjectStubs } from './stubgql-CloudTypes'

export const createTestProject = (title: string): CodegenTypeMap['Project'] => {
  const snakeTitle = _.kebabCase(title)

  // TODO: What a mess, type this without all the hacks
  return {
    ...testNodeId('Project'),
    isCTConfigured: true,
    isE2EConfigured: true,
    projectId: `${snakeTitle}-id`,
    title,
    projectRoot: `/usr/local/dev/projects/${snakeTitle}`,
    specs: {
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
      },
      __typename: 'SpecConnection' as const,
      edges: [
        ...randomComponents(200, 'Spec').map((c) => {
          return {
            __typename: 'SpecEdge' as const,
            cursor: 'eoifjew',
            node: {
              ...c,
              id: c.absolute,
            },
          }
        }),
      ],
    },
    config,
    cloudProject: CloudProjectStubs.componentProject,
    codeGenGlob: '/**/*.vue',
  }
}

export const stubProject: MaybeResolver<Project> = createTestProject('Some Test Title')
