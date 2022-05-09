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
    const info = obj.info

    assert(obj.context?.cloud, 'Cannot execute without a DataContext')
    assert(info, 'Cannoy execute without GraphQLResolveInfo')

    const operationName = obj.context.cloud.makeOperationName(info)

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
      // When we respond eagerly with a result, but receive an updated value
      // for the query, we can "push" the data down using the pushFragment subscription
      onUpdatedResult (result) {
        obj.context?.graphql.pushResult({
          result: result[info.fieldName] ?? null,
          source: obj.rootValue,
          info,
          ctx: obj.context,
        })
      },
    }) as any
  },
})
