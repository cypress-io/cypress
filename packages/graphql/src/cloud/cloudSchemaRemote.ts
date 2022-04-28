import { delegateToSchema } from '@graphql-tools/delegate'
import { wrapSchema } from '@graphql-tools/wrap'
import { buildSchema, GraphQLResolveInfo } from 'graphql'
import { pathToArray } from 'graphql/jsutils/Path'
import fs from 'fs'
import path from 'path'

import { cloudSchemaRemoteExecutor } from './cloudSchemaRemoteExecutor'

export const CLOUD_SCHEMA_PATH = path.join(__dirname, '../../schemas', 'cloud.graphql')

// Get the Remote schema we've sync'ed locally
export const cloudSchemaRemote = buildSchema(
  fs.readFileSync(CLOUD_SCHEMA_PATH, 'utf-8'),
  { assumeValid: true },
)

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const cloudSchemaRemoteWrapped = wrapSchema({
  schema: cloudSchemaRemote,
  executor: cloudSchemaRemoteExecutor,
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
        rootValue: _parent,
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
