import { DocumentNode, print } from 'graphql'

import type { DataContext } from '@packages/data-context'
import type { RequestPolicy } from '@urql/core'

export interface RemoteExecutionRoot {
  requestPolicy?: RequestPolicy
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

  const requestPolicy: RequestPolicy | undefined = rootValue?.requestPolicy ?? null

  try {
    const executorResult = await context.cloud.executeRemoteGraphQL({
      operationType,
      document,
      variables,
      query: print(document),
      requestPolicy,
    })

    context.debug('executorResult %o', executorResult)

    return executorResult
  } catch (error) {
    if (error.networkError?.message === 'Unauthorized' || error.graphQLErrors.some((e: Error) => e.message === 'Unauthorized')) {
      await context.actions.auth.logout()

      return { data: null }
    }

    throw error
  }
}
