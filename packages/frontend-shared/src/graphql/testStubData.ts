import type {
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { randomComponents } from './specs/testStubSpecs'
import { testNodeId } from './testUtils'

export const createTestProject = (title: string): CodegenTypeMap['Project'] => {
  return {
    ...testNodeId('Project'),
    isFirstTimeCT: true,
    isFirstTimeE2E: true,
    projectId: `${title}-id`,
    title,
    projectRoot: `/usr/local/dev/projects/${title}`,
    specs: {
      pageInfo: {
        __typename: 'PageInfo',
        hasNextPage: true,
        hasPreviousPage: false
      },
      __typename: 'SpecConnection',
      edges: [
        ...randomComponents(200).map(c => ({
          __typename: 'SpecEdge' as const,
          cursor: 'eoifjew',
          node: {
            ...c,
          }
        }))
      ]
    }
  }
}

export const activeProject = createTestProject('test-project')

export const project = activeProject
