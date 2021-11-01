import type { Executor } from '@graphql-tools/utils/executor'
import { print } from 'graphql'

import type { DataContext } from '@packages/data-context'

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor: Executor<DataContext> = async (obj) => {
  const { document, variables, context } = obj

  if (!context?.user) {
    return { data: null }
  }

  const executorResult = await context.cloud.executeRemoteGraphQL({
    document,
    variables,
    query: print(document),
  })

  context.debug('executorResult %o', executorResult)

  return executorResult
}
