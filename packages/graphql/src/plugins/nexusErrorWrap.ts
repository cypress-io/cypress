import type { DataContext } from '@packages/data-context'
import { plugin } from 'nexus'
import dedent from 'dedent'
import { CypressErrorLike, isCypressError } from '@packages/types'

export const nexusErrorWrap = plugin({
  name: 'NexusErrorWrap',
  description: dedent`
    When we have an error returned from a field, check if the parent 
    type is "error-like", and if so, prep it for a return type
  `,
  onCreateFieldResolver (info) {
    if (info.parentTypeConfig.name === 'ApplicationError' || info.parentTypeConfig.name === 'Warning') {
      return (root, args, ctx: DataContext, info, next) => {
        function handleError (err: CypressErrorLike) {
          if (isCypressError(err)) {
            return ctx.prepError(err)
          }

          return err
        }

        return plugin.completeValue(next(root, args, ctx, info), handleError, handleError)
      }
    }

    return
  },
})
