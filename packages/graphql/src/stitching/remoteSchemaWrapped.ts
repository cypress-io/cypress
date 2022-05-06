import { wrapSchema } from '@graphql-tools/wrap'
import type { DataContext } from '@packages/data-context'
import assert from 'assert'
import { remoteSchema } from './remoteSchema'

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const remoteSchemaWrapped = wrapSchema<DataContext>({
  schema: remoteSchema,
  executor: (obj) => {
    assert(obj.context?.cloud, 'Cannot execute without a DataContext')

    return obj.context.cloud.executeRemoteGraphQL({
      operationType: obj.operationType ?? 'query',
      document: obj.document,
      variables: obj.variables,
    }) as any
  },
})
