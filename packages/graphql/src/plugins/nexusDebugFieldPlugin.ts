import { plugin } from 'nexus'
import debugLib from 'debug'
import { pathToArray } from 'graphql/jsutils/Path'

const debugField = debugLib(`cypress-verbose:graphql:fields`)

const SLOW_FIELD_THRESHOLD = 100 // Log any field taking longer than 100ms

const delta = (d: Date) => {
  return new Date().valueOf() - d.valueOf()
}

export const nexusDebugLogPlugin = plugin({
  name: 'NexusDebugLogPlugin',
  description: 'Wraps the resolve & adds debug logs for operations, and for fields if there is a slow execution.',
  // When we create a field resolver, we can wrap it in a field
  onCreateFieldResolver (info) {
    // For fields, we only want to log if the field takes longer than SLOW_FIELD_THRESHOLD to execute.
    // Also log if it's hanging for some reason
    return (root, args, ctx, info, next) => {
      const start = new Date()
      const resolvePath = pathToArray(info.path)

      function maybeLog (suffix = '') {
        if (delta(start) > SLOW_FIELD_THRESHOLD) {
          debugField(`${info.operation.operation} ${info.operation.name?.value ?? `(anonymous)`} took ${delta(start)}ms to resolve ${JSON.stringify(resolvePath)}${suffix}`)
        }
      }

      return plugin.completeValue(next(root, args, ctx, info), (val) => {
        maybeLog()

        return val
      }, (err) => {
        maybeLog()
        throw err
      })
    }
  },
})
