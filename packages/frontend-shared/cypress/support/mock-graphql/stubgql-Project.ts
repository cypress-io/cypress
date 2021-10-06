import _ from 'lodash'

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
  }
}

export const stubProject: MaybeResolver<Project> = createTestProject('Some Test Title')
