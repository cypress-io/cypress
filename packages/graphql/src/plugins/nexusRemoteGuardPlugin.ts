import type { DataContext } from '@packages/data-context'
import { DirectiveLocation, GraphQLDirective } from 'graphql'
import { plugin } from 'nexus'
import type { NexusGenFieldTypes } from '../gen/nxs.gen'

export const remoteGuardDirective = new GraphQLDirective({
  name: 'skipRemoteGuard',
  description: 'Skips any remoteGuard defined internally on the field',
  locations: [DirectiveLocation.QUERY],
  isRepeatable: false,
})

// Added here because the field is defined automatically by the merged schema
const CLOUD_EXECUTION: Record<string, Record<string, keyof NexusGenFieldTypes['Subscription']>> = {
  Query: {
    cloudViewer: 'cloudViewerChange',
  },
}

export const nexusMaxExecutionPlugin = plugin({
  name: 'remoteGuardPlugin',
  description: 'If a remoteGuard is provided, adds a Promise.race to the resolution of the field, defaulting to 50ms',
  fieldDefTypes: `remoteGuard?: keyof NexusGenFieldTypes['Subscription']`,
  onCreateFieldResolver (field) {
    const triggerOnResult = (field.fieldConfig.extensions?.nexus?.config?.remoteGuard || CLOUD_EXECUTION[field.parentTypeConfig.name]?.[field.fieldConfig.name]) as keyof NexusGenFieldTypes['Subscription'] | undefined

    if (!triggerOnResult) {
      return
    }

    return async (source, args, ctx: DataContext, info, next) => {
      if (info.operation.operation !== 'query' || info.operation.directives?.some((d) => d.name.value === 'skipRemoteGuard')) {
        return next(source, args, ctx, info)
      }

      let timeoutHit = false
      const RACE_RESULT = {} as const

      const result = await Promise.race([
        // 50ms should be enough to resolve if there's an eager response from
        // the urql cache
        new Promise((resolve) => setTimeout(() => resolve(RACE_RESULT), 50)),
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
