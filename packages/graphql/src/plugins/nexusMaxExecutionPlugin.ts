import type { DataContext } from '@packages/data-context'
import { DirectiveLocation, GraphQLDirective, GraphQLEnumType, GraphQLInt, GraphQLNonNull } from 'graphql'
import { plugin } from 'nexus'
import assert from 'assert'
import type { TriggerOnResultOptions } from '../gen/nxs.gen'

export const maxExecutionDirective = new GraphQLDirective({
  name: 'maxExecution',
  description: 'Add a max-execution time for field, and an optional event to trigger when the field does resolve',
  locations: [DirectiveLocation.FIELD],
  isRepeatable: false,
  args: {
    duration: {
      type: new GraphQLNonNull(GraphQLInt),
      description: 'Amount of time (in ms) we should wait before returning null for this field',
    },
    triggerOnResult: {
      type: new GraphQLEnumType({
        name: 'TriggerOnResultOptions',
        values: {
          cloudViewerChange: {},
          versionsResolved: {},
          specsChange: {},
        },
      }),
    },
  },
})

export const nexusMaxExecutionPlugin = plugin({
  name: 'maxExecutionPlugin',
  description: 'If a maxExecution directive is provided, adds a configured Promise.race to the resolution of the field',
  onCreateFieldResolver (field) {
    return async (source, args, ctx: DataContext, info, next) => {
      if (info.operation.operation !== 'query') {
        return next(source, args, ctx, info)
      }

      const node = info.fieldNodes.map((n) => n.directives?.find((d) => d.name.value === 'maxExecution')).filter((f) => f)

      // Immediately resolve if we don't have an explicit guard for the field execution
      if (!node?.length) {
        return next(source, args, ctx, info)
      }

      const [maxExecutionDirective] = node

      const durationArg = maxExecutionDirective?.arguments?.find((a) => a.name.value === 'duration')
      const triggerArg = maxExecutionDirective?.arguments?.find((a) => a.name.value === 'triggerOnResult')

      assert(durationArg?.value.kind === 'IntValue')
      const raceMs = Number(durationArg.value.value)
      const triggerOnResult = triggerArg?.value.kind === 'EnumValue' ? (triggerArg.value.value as TriggerOnResultOptions) : null

      let timeoutHit = false
      const RACE_RESULT = {} as const

      const result = await Promise.race([
        // If this wins, we resolve with null, and trigger the appropriate client subscription
        new Promise((resolve) => setTimeout(() => resolve(RACE_RESULT), raceMs)),
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
