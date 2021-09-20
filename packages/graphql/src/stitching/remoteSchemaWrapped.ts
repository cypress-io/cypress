import { wrapSchema } from '@graphql-tools/wrap'
import { remoteSchema } from './remoteSchema'
import { remoteSchemaExecutor } from './remoteSchemaExecutor'

// Takes the remote schema & wraps with an "executor", allowing us to delegate
// queries we know should be executed against this server
export const remoteSchemaWrapped = wrapSchema({
  schema: remoteSchema,
  executor: remoteSchemaExecutor,
})
