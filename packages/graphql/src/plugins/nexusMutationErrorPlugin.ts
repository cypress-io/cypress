import { plugin } from 'nexus'
import { getError } from '@packages/errors'
import type { DataContext } from '@packages/data-context'
import { getNamedType, isObjectType } from 'graphql'
import _ from 'lodash'

export const mutationErrorPlugin = plugin({
  name: 'MutationErrorPlugin',
  description: 'Wraps any mutation fields and handles any uncaught errors',
  onCreateFieldResolver: (def) => {
    if (def.parentTypeConfig.name !== 'Mutation') {
      return
    }

    return (source, args, ctx: DataContext, info, next) => {
      return plugin.completeValue(next(source, args, ctx, info), (v) => v, (err) => {
        ctx.update((d) => {
          d.diagnostics.error = {
            id: _.uniqueId('Error'),
            cypressError: err.isCypressErr
              ? err
              : getError('UNEXPECTED_MUTATION_ERROR', def.fieldConfig.name, args, err),
          }
        })

        const returnType = getNamedType(info.returnType)

        // If we're returning a query, we're getting the "baseError" here anyway
        if (isObjectType(returnType) && returnType.name === 'Query') {
          return {}
        }

        throw err
      })
    }
  },
})
