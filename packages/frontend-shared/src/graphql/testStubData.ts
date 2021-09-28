import type {
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { testNodeId } from './testUtils'

export const createTestProject = (title: string): CodegenTypeMap['Project'] => {
  return {
    ...testNodeId('Project'),
    isFirstTimeCT: true,
    isFirstTimeE2E: true,
    projectId: `${title}-id`,
    title,
    projectRoot: `/usr/local/dev/projects/${title}`,
  }
}

export const activeProject = createTestProject('test-project')

export const project = activeProject
