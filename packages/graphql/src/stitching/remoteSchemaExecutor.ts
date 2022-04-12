import { DocumentNode, print } from 'graphql'

import type { DataContext } from '@packages/data-context'
import type { RequestPolicy } from '@urql/core'

export interface RemoteExecutionRoot {
  requestPolicy?: RequestPolicy
  /**
   * If we set the requestPolicy to cache-and-network, this is
   * the callback fired in the event where the remote data is different
   * than what we had in the cache.
   */
  onCacheUpdate?: () => void
}

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor = async (obj: Record<string, any>) => {
  const { document: _document, operationType, variables, context: _context, rootValue } = obj

  const document: DocumentNode = _document
  const context: DataContext = _context

  if (!context?.user) {
    return { data: null }
  }

  const executorResult = await context.cloud.executeRemoteGraphQL({
    operationType,
    document,
    variables,
    query: print(document),
    requestPolicy: rootValue?.requestPolicy,

  })

  context.debug('executorResult %o', executorResult)

  return executorResult
}
