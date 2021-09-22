import type { Executor } from '@graphql-tools/utils/executor'
import { print, graphql } from 'graphql'
import { wrapSchema } from '@graphql-tools/wrap'

import { remoteSchema } from '../stitching/remoteSchema'

const testExecutor: Executor<StubContext> = async ({ document, context }) => {
  const result = await graphql({
    schema: remoteSchema,
    rootValue: CloudRunQuery,
    source: print(document),
    contextValue: context,
  }) as any

  return result
}

export const remoteTestSchema = wrapSchema({
  schema: remoteSchema,
  executor: testExecutor,
})

/**
 * Mocks the "test context" behavior. Used from the frontend
 */
export class StubContext {
  _remoteSchema = remoteTestSchema

  get localProjects () {
    return []
  }
}
