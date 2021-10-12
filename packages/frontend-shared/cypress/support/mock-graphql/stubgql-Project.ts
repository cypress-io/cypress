import _ from 'lodash'
import { randomComponents } from './testStubSpecs'
import config from '../../fixtures/config.json'

import type {
  Project,
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { MaybeResolver, testNodeId } from './clientTestUtils'

export const createTestProject = (title: string): CodegenTypeMap['Project'] => {
  const snakeTitle = _.kebabCase(title)

  // TODO: What a mess, type this without all the hacks
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
  }
}

export const stubProject: MaybeResolver<Project> = createTestProject('Some Test Title')
