import { delegateToSchema } from '@graphql-tools/delegate'
import { wrapSchema } from '@graphql-tools/wrap'
import type { GraphQLResolveInfo } from 'graphql'
import { pathToArray } from 'graphql/jsutils/Path'
import { remoteSchema } from './remoteSchema'
import { remoteSchemaExecutor } from './remoteSchemaExecutor'

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const remoteSchemaWrapped = wrapSchema({
  schema: remoteSchema,
  executor: remoteSchemaExecutor,
  // Needed to ensure the operationName is created / propagated correctly
  createProxyingResolver ({
    subschemaConfig,
    operation,
    transformedSchema,
  }) {
    return function proxyingResolver (_parent, _args, context, info) {
      return delegateToSchema({
        schema: subschemaConfig,
        operation,
        context,
        info,
        operationName: getOperationName(info),
        transformedSchema,
      })
    }
  },
})

/**
 * Gives a descriptive GraphQL Operation Name to any queries going out to
 * the external schema
 */
function getOperationName (info: GraphQLResolveInfo) {
  if (info.operation.name?.value.endsWith('_batched')) {
    return info.operation.name?.value
  }

  return `${info.operation.name?.value ?? 'Anonymous'}_${pathToArray(info.path).join('_')}`
}
