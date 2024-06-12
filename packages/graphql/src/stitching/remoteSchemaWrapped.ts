import { delegateToSchema } from '@graphql-tools/delegate'
import { wrapSchema } from '@graphql-tools/wrap'
import type { DataContext } from '@packages/data-context'
import type { RequestPolicy } from '@urql/core'
import assert from 'assert'
import debugLib from 'debug'
import { BREAK, OperationDefinitionNode, visit } from 'graphql'
import { remoteSchema } from './remoteSchema'

const debug = debugLib('cypress:graphql:remoteSchemaWrapped')

export interface RemoteExecutionRoot {
  requestPolicy?: RequestPolicy
}

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const remoteSchemaWrapped = wrapSchema<DataContext>({
  schema: remoteSchema,
  createProxyingResolver: ({
    subschemaConfig,
    operation,
    transformedSchema,
  }) => {
    return (source, args, context, info) => {
      return delegateToSchema({
        rootValue: source,
        schema: subschemaConfig,
        operation,
        transformedSchema,
        context,
        info,
      })
    }
  },
  executor: (obj) => {
    const info = obj.info

    assert(obj.context?.cloud, 'Cannot execute without a DataContext')
    assert(info, 'Cannot execute without GraphQLResolveInfo')

    const operationName = obj.context.cloud.makeOperationName(info)
    const requestPolicy = ((obj.rootValue ?? {}) as RemoteExecutionRoot).requestPolicy ?? 'cache-first'

    debug('executing: %j', { rootValue: obj.rootValue, operationName, requestPolicy })

    const operationDoc = visit(obj.document, {
      OperationDefinition (node) {
        if (!node.name) {
          return {
            ...node, name: { kind: 'Name', value: operationName },
          } as OperationDefinitionNode
        }

        return BREAK
      },
    })

    const context = obj.context

    return context.cloud.executeRemoteGraphQL({
      fieldName: info.fieldName,
      requestPolicy,
      operationType: obj.operationType ?? 'query',
      operationDoc,
      operationVariables: obj.variables,
      // When we respond eagerly with a result, but receive an updated value
      // for the query, we can "push" the data down using the pushFragment subscription
      onUpdatedResult (result) {
        context.graphql.pushResult({
          result: result?.[info.fieldName] ?? null,
          source: obj.rootValue,
          info,
          ctx: context,
        })
      },
    }) as any
  },
})
