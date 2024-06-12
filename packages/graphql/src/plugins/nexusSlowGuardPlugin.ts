import { plugin } from 'nexus'
import { isPromiseLike, pathToArray } from 'nexus/dist/utils'
import chalk from 'chalk'

const HANGING_RESOLVER_THRESHOLD = 100

export const nexusSlowGuardPlugin = plugin({
  name: 'NexusSlowGuard',
  description: 'If there is a very slow / hanging execution of a field, we detect/log to the console it in development',
  fieldDefTypes: 'slowLogThreshold?: number | false',
  // When we create a field resolver, we can wrap it in a field
  onCreateFieldResolver (field) {
    const threshold = (field.fieldConfig.extensions?.nexus?.config.slowLogThreshold ?? HANGING_RESOLVER_THRESHOLD) as number | false

    return (root, args, ctx, info, next) => {
      // Don't worry about slowness in Mutations / Subscriptions, these aren't blocking the execution of initial load
      if (info.operation.operation === 'mutation' || info.operation.operation === 'subscription') {
        return next(root, args, ctx, info)
      }

      const result = next(root, args, ctx, info)

      if (isPromiseLike(result) && threshold !== false) {
        const resolvePath = pathToArray(info.path)
        const start = process.hrtime.bigint()
        const hanging = setTimeout(() => {
          const operationId = `${info.operation.operation} ${info.operation.name?.value ?? `(anonymous)`}`

          if (process.env.CYPRESS_INTERNAL_ENV !== 'production') {
            const totalMS = (process.hrtime.bigint() - start) / BigInt(1000000)

            // eslint-disable-next-line no-console
            console.error(chalk.red(`\n\nNexusSlowGuard: Taking more than ${threshold}ms to execute ${JSON.stringify(resolvePath)} for ${operationId} (total time ${totalMS}ms)\n\n`))
          }
        }, threshold)

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
