import { plugin } from 'nexus'
import { isPromiseLike, pathToArray } from 'nexus/dist/utils'
import chalk from 'chalk'

const HANGING_RESOLVER_THRESHOLD = 2000

export const nexusSlowGuardPlugin = plugin({
  name: 'NexusSlowGuard',
  description: 'If there is a very slow / hanging execution of a field, we detect/log to the console it in development',
  // When we create a field resolver, we can wrap it in a field
  onCreateFieldResolver () {
    // For fields, we only want to log if the field takes longer than SLOW_FIELD_THRESHOLD to execute.
    // Also log if it's hanging for some reason
    return (root, args, ctx, info, next) => {
      const result = next(root, args, ctx, info)

      if (isPromiseLike(result)) {
        const resolvePath = pathToArray(info.path)
        const hanging = setTimeout(() => {
          const operationId = `${info.operation.operation} ${info.operation.name?.value ?? `(anonymous)`}`

          if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error(chalk.red(`\n\nNexusSlowGuard: Taking more than ${HANGING_RESOLVER_THRESHOLD} to execute ${JSON.stringify(resolvePath)} for ${operationId}\n\n`))
          }
        }, HANGING_RESOLVER_THRESHOLD)

        return plugin.completeValue(result, (val) => {
          clearTimeout(hanging)

          return val
        }, (err) => {
          clearTimeout(hanging)
          throw err
        })
      }

      return result
    }
  },
})
