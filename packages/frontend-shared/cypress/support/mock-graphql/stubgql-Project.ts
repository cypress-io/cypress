import _ from 'lodash'
import { randomComponents } from '../../../src/graphql/specs/testStubSpecs'

import type {
  Project,
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { MaybeResolver, testNodeId } from './clientTestUtils'

export const createTestProject = (title: string): CodegenTypeMap['Project'] => {
  const snakeTitle = _.kebabCase(title)

  return {
    ...testNodeId('Project'),
    isFirstTimeCT: true,
    isFirstTimeE2E: true,
    projectId: `${snakeTitle}-id`,
    title,
    projectRoot: `/usr/local/dev/projects/${snakeTitle}`,
    specs: {
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false,
      },
      __typename: 'SpecConnection',
      edges: [
        ...randomComponents(200).map((c) => {
          return {
            __typename: 'SpecEdge' as const,
            cursor: 'eoifjew',
            node: {
              ...c,
            },
          }
        }),
      ],
    },
  }
}

export const stubProject: MaybeResolver<Project> = createTestProject('Some Test Title')
