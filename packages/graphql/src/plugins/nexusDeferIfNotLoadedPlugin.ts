import { plugin } from 'nexus'
import debugLib from 'debug'
import { defaultFieldResolver, getNamedType, isNonNullType } from 'graphql'
import type { DataContext } from '@packages/data-context'
import { remoteSchema } from '../stitching/remoteSchema'

const NO_RESULT = {}
// 2ms should be enough time to resolve from the local cache of the
// cloudUrqlClient in CloudDataSource
const RACE_MAX_EXECUTION_MS = 2
const debug = debugLib('cypress:graphql:nexusDeferIfNotLoadedPlugin')

export const nexusDeferResolveGuard = plugin({
  name: 'nexusDeferResolveGuard',
  onCreateFieldResolver () {
    return (source, args, ctx, info, next) => {
      // If we are hitting the resolver with the "source" value, we can just resolve with this,
      // no need to continue to the rest of the resolver stack, we just need to continue completing
      // the execution of the field
      if (source?.[ctx.graphql.RESOLVED_SOURCE]) {
        debug(`Resolving %s for pushFragment with %j`, info.fieldName, source[info.fieldName])

        return defaultFieldResolver(source, args, ctx, info)
      }

      return next(source, args, ctx, info)
    }
  },
})

/**
 * This plugin taps into each of the requests and checks for the existence
 * of a "Cloud" prefixed type. When we see these, we know that we're dealing
 * with a remote API. We can also specify `deferIfNotLoaded: true` on the Nexus definition
 * to indicate that this is a remote request, such as resolving the "versions" field
 */
export const nexusDeferIfNotLoadedPlugin = plugin({
  name: 'nexusDeferIfNotLoadedPlugin',
  fieldDefTypes: 'deferIfNotLoaded?: true',
  onCreateFieldResolver (def) {
    const { name: parentTypeName } = def.parentTypeConfig

    // Don't ever need to do this on Subscription / Mutation fields.
    if (parentTypeName === 'Mutation' || parentTypeName === 'Subscription') {
      return
    }

    // Also don't need to if the type is in the cloud schema, (and isn't a Query) since these don't
    // actually need to resolve themselves, they're resolved from the remote request
    if (parentTypeName !== 'Query' && remoteSchema.getType(parentTypeName)) {
      return
    }

    // Specified w/ deferIfNotLoaded: true on the field definition
    const shouldDeferIfNotLoaded = Boolean(def.fieldConfig.extensions?.nexus?.config.deferIfNotLoaded)

    // Fields where type: 'Cloud*', e.g. 'cloudViewer' which is type: 'CloudUser'
    const isEligibleCloudField = getNamedType(def.fieldConfig.type).name.startsWith('Cloud')

    if (!isEligibleCloudField && !shouldDeferIfNotLoaded) {
      return
    }

    const qualifiedField = `${def.parentTypeConfig.name}.${def.fieldConfig.name}`

    // We should never allow a non-null query type, this is an error should be caught at development time
    if (isNonNullType(def.fieldConfig.type)) {
      throw new Error(`Cannot add nexusDeferIfNotLoadedPlugin to non-nullable field ${qualifiedField}`)
    }

    debug(`Adding nexusDeferIfNotLoadedPlugin for %s`, qualifiedField)

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
        Promise.resolve(next(source, args, ctx, info)).then(async (result) => {
          if (!didRace) {
            debug(`Racing %s resolved immediately`, qualifiedField)

            return result
          }

          debug(`Racing %s eventually resolved with %o`, qualifiedField, result, ctx.graphqlRequestInfo?.operationName)

          ctx.graphql.pushResult({ source, result, info, ctx })
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
