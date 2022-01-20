import { DocumentNode, print } from 'graphql'

import type { DataContext } from '@packages/data-context'

/**
 * Takes a "document" and executes it against the GraphQL schema
 * @returns
 */
export const remoteSchemaExecutor = async (obj: Record<string, any>) => {
  const { document: _document, operationType, variables, context: _context } = obj

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
  })

  context.debug('executorResult %o', executorResult)

  return executorResult
}
