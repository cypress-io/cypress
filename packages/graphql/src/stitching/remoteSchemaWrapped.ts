import { wrapSchema } from '@graphql-tools/wrap'
import type { DataContext } from '@packages/data-context'
import type { RequestPolicy } from '@urql/core'
import assert from 'assert'
import { BREAK, OperationDefinitionNode, visit } from 'graphql'
import { remoteSchema } from './remoteSchema'

export interface RemoteExecutionRoot {
  requestPolicy?: RequestPolicy
}

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const remoteSchemaWrapped = wrapSchema<DataContext>({
  schema: remoteSchema,
  executor: (obj) => {
    assert(obj.context?.cloud, 'Cannot execute without a DataContext')
    assert(obj.info, 'Cannoy execute without GraphQLResolveInfo')

    const operationName = obj.context.cloud.makeOperationName(obj.info)

    return obj.context.cloud.executeRemoteGraphQL({
      requestPolicy: ((obj.rootValue ?? {}) as RemoteExecutionRoot).requestPolicy ?? 'cache-first',
      operationType: obj.operationType ?? 'query',
      document: visit(obj.document, {
        OperationDefinition (node) {
          if (!node.name) {
            return {
              ...node, name: { kind: 'Name', value: operationName },
            } as OperationDefinitionNode
          }

          return BREAK
        },
      }),
      variables: obj.variables,
    }) as any
  },
})
