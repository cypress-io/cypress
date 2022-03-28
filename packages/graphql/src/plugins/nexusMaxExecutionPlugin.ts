import type { DataContext } from '@packages/data-context'
import { DirectiveLocation, GraphQLDirective } from 'graphql'
import { plugin } from 'nexus'
import type { NexusGenFieldTypes } from '../gen/nxs.gen'

interface MaxExecutionConfig {
  duration: number
  triggerOnResult?: keyof NexusGenFieldTypes['Subscription']
}

export const maxExecutionDirective = new GraphQLDirective({
  name: 'skipMaxExecutionGuard',
  description: 'Skips any maxExecution guard defined internally on the field',
  locations: [DirectiveLocation.QUERY],
  isRepeatable: false,
})

// Added here because the field is defined automatically by the merged schema
const CLOUD_EXECUTION: Record<string, Record<string, MaxExecutionConfig>> = {
  Query: {
    cloudViewer: {
      duration: 500,
      triggerOnResult: 'cloudViewerChange',
    },
  },
}

export const nexusMaxExecutionPlugin = plugin({
  name: 'maxExecutionPlugin',
  description: 'If a maxExecution directive is provided, adds a configured Promise.race to the resolution of the field',
  fieldDefTypes: `maxExecution?: { duration: number, triggerOnResult?: keyof NexusGenFieldTypes['Subscription'] }`,
  onCreateFieldResolver (field) {
    const maxExecutionConfig = (field.fieldConfig.extensions?.nexus?.config?.maxExecution || CLOUD_EXECUTION[field.parentTypeConfig.name]?.[field.fieldConfig.name]) as MaxExecutionConfig | undefined

    if (!maxExecutionConfig) {
      return
    }

    return async (source, args, ctx: DataContext, info, next) => {
      if (info.operation.operation !== 'query' || info.operation.directives?.some((d) => d.name.value === 'skipMaxExecutionGuard')) {
        return next(source, args, ctx, info)
      }

      const { duration, triggerOnResult } = maxExecutionConfig

      let timeoutHit = false
      const RACE_RESULT = {} as const

      const result = await Promise.race([
        // If this wins, we resolve with null, and trigger the appropriate client subscription
        new Promise((resolve) => setTimeout(() => resolve(RACE_RESULT), duration)),
        // If this wins, we resolve immediately with the result,
        // otherwise we trigger the "triggerOnResult" with the payload
        Promise.resolve(next(source, args, ctx, info)).then((result) => {
          if (timeoutHit) {
            if (triggerOnResult) {
              ctx.emitter[triggerOnResult]()
            }
          } else {
            return result
          }
        }).catch((e) => {}),
      ])

      if (result === RACE_RESULT) {
        timeoutHit = true

        return null
      }

      return result
    }
  },
})
