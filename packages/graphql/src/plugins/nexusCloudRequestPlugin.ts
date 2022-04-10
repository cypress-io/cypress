import { plugin } from 'nexus'
import debugLib from 'debug'
import { getNamedType, isNonNullType } from 'graphql'
import type { DataContext } from '@packages/data-context'

const NO_RESULT = {}
// 2ms should be enough time to resolve from the local cache of the
// cloudUrqlClient in CloudDataSource
const RACE_MAX_EXECUTION_MS = 2
const IS_DEVELOPMENT = process.env.CYPRESS_INTERNAL_ENV !== 'production'
const debug = debugLib('cypress:graphql:nexusCloudRequestPlugin')

/**
 * This plugin taps into each of the requests and checks for the existence
 * of a "Cloud" prefixed type. When we see these, we know that we're dealing
 * with a remote API. We can also specify `remote: true` on the Nexus definition
 * to indicate that this is a remote request, such as resolving the "versions" field
 */
export const nexusCloudRequestPlugin = plugin({
  name: 'nexusCloudRequestPlugin',
  fieldDefTypes: 'remote?: true',
  onCreateFieldResolver (def) {
    const { name: parentTypeName } = def.parentTypeConfig

    // Don't ever need to do this on Subscription / Mutation fields,
    // or on the Cloud types themselves, since these don't actually need to resolve themselves,
    // they're resolved from the remote request
    if (parentTypeName === 'Mutation' || parentTypeName === 'Subscription' || parentTypeName.startsWith('Cloud')) {
      return
    }

    // Specified w/ remote: true on the field definition
    const isMarkedAsRemote = Boolean(def.fieldConfig.extensions?.nexus?.config.remote)

    // Fields where type: 'Cloud*', e.g. 'cloudViewer' which is type: 'CloudUser'
    const isEligibleCloudField = getNamedType(def.fieldConfig.type).name.startsWith('Cloud')

    if (!isEligibleCloudField && !isMarkedAsRemote) {
      return
    }

    const qualifiedField = `${def.parentTypeConfig.name}.${def.fieldConfig.name}`

    // We should never allow a non-null query type, this is an error should be caught at development time
    if (isNonNullType(def.fieldConfig.type)) {
      throw new Error(`Cannot add nexusCloudRequestPlugin to non-nullable field ${qualifiedField}`)
    }

    debug(`Adding nexusCloudRequestPlugin for %s`, qualifiedField)

    return async (source, args, ctx: DataContext, info, next) => {
      // Don't need to race Mutations / Subscriptions, which can return types containing these fields
      // these can just call through and don't need to be resolved immediately, because there's an expectation
      // of potential delay built-in to these contracts
      if (
        info.operation.operation === 'mutation' ||
        info.operation.operation === 'subscription'
      ) {
        return next(source, args, ctx, info)
      }

      debug(`Racing execution for %s`, qualifiedField)

      let didRace = false

      const raceResult: unknown = await Promise.race([
        new Promise((resolve) => setTimeout(() => resolve(NO_RESULT), RACE_MAX_EXECUTION_MS)),
        Promise.resolve(next(source, args, ctx, info)).then((result) => {
          if (!didRace) {
            debug(`Racing %s resolved immediately`, qualifiedField)

            return result
          }

          debug(`Racing %s eventually resolved with %o`, qualifiedField, result, ctx.graphqlRequestInfo?.operationName)

          // If we raced the query, and this looks like a client request we can re-execute,
          // we will look to do so.
          if (ctx.graphqlRequestInfo?.operationName) {
            // We don't want to notify the client if we see a refetch header, and we want to warn if
            // we raced twice, as this means we're not caching the data properly
            if (ctx.graphqlRequestInfo.headers['x-cypress-graphql-refetch']) {
              // If we've hit this during a refetch, but the refetch was unrelated to the original request,
              // that's fine, it just means that we might receive a notification to refetch in the future for the other field
              if (IS_DEVELOPMENT && ctx.graphqlRequestInfo.headers['x-cypress-graphql-refetch'] === `${ctx.graphqlRequestInfo?.operationName}.${qualifiedField}`) {
                // eslint-disable-next-line no-console
                console.error(new Error(`
                  It looks like we hit the Promise.race while re-executing the operation ${ctx.graphqlRequestInfo.operationName}
                  this means that we sent the client a signal to refetch, but the data wasn't stored when it did.
                  This likely means we're not caching the result of the the data properly.
                `))
              }
            } else {
              debug(`Notifying app %s, %s of updated field %s`, ctx.graphqlRequestInfo.app, ctx.graphqlRequestInfo.operationName, qualifiedField)
              ctx.emitter.notifyClientRefetch(ctx.graphqlRequestInfo.app, ctx.graphqlRequestInfo.operationName, qualifiedField, ctx.graphqlRequestInfo.variables)
            }
          } else {
            debug(`No operation to notify of result for %s`, qualifiedField)
          }
        }).catch((e) => {
          debug(`Remote execution error %o`, e)

          return null
        }),
      ])

      if (raceResult === NO_RESULT) {
        debug(`%s did not resolve immediately`, qualifiedField)
        didRace = true

        return null
      }

      return raceResult
    }
  },
})
