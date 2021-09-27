import type {
  CodegenTypeMap,
} from '../generated/test-graphql-types.gen'
import { testNodeId } from './testUtils'

export const createActiveProject = (): CodegenTypeMap['Project'] => {
  return {
    ...testNodeId('Project'),
    isFirstTimeCT: true,
    isFirstTimeE2E: true,
    title: 'test-project',
    projectRoot: '/usr/local/dev/projects/test-project',
  }
}

export const activeProject = createActiveProject()
