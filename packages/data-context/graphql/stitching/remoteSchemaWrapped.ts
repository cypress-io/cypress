import { delegateToSchema } from '@graphql-tools/delegate'
import { wrapSchema } from '@graphql-tools/wrap'
import type { DataContext } from '../../src'
import type { RequestPolicy } from '@urql/core'
import assert from 'assert'
import debugLib from 'debug'
import { BREAK, OperationDefinitionNode, visit } from 'graphql'
import { remoteSchema } from './remoteSchema'

const debug = debugLib('cypress:graphql:remoteSchemaWrapped')

/**
 * Cloud fields that are public — i.e. should be queryable even when the user
 * isn't logged in. The default short-circuit in `executeRemoteGraphQL` returns
 * `{ data: null }` for unauthenticated requests; fields in this set bypass that
 * gate. Keep this set tight; greppable so it's easy to audit.
 */
const PUBLIC_CLOUD_FIELDS = new Set<string>(['cloudAppMessages'])

/**
 * Cloud fields that the binary explicitly refuses to query when the
 * `CYPRESS_APP_MESSAGES` env var is set to `0` or `false`. Mirrors the
 * `CYPRESS_CRASH_REPORTS=0` pattern. Unpublished — available for users / orgs
 * that want to keep the binary fully off the network for messaging purposes.
 */
const APP_MESSAGES_DISABLED = (): boolean => {
  return process.env.CYPRESS_APP_MESSAGES === '0' || process.env.CYPRESS_APP_MESSAGES === 'false'
}

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

    // App-messages-specific binary-side gates. Run mode is naturally short-
    // circuited because the banner UI doesn't exist there (no caller to fire
    // the query). The env-var check enforces the unpublished
    // `CYPRESS_APP_MESSAGES=0` opt-out — when set, return an empty result
    // without touching the network.
    if (info.fieldName === 'cloudAppMessages' && APP_MESSAGES_DISABLED()) {
      debug('cloudAppMessages disabled via CYPRESS_APP_MESSAGES env var; returning empty')

      return { data: { cloudAppMessages: [] } }
    }

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
      allowUnauthenticated: PUBLIC_CLOUD_FIELDS.has(info.fieldName),
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
