import type { Executor } from '@graphql-tools/utils/executor'
import { print } from 'graphql'

import type { DataContext } from '@packages/data-context'

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor: Executor<DataContext> = (obj) => {
  const { document, variables, context } = obj

  if (!context?.user) {
    return { data: null }
  }

  return context.cloud.executeRemoteGraphQL({
    document,
    variables,
    query: print(document),
  })
}
