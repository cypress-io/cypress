import { objectType } from 'nexus'
import { RunSpecErrorCodeEnum } from '../enumTypes'

export const RunSpecError = objectType({
  name: 'RunSpecError',
  description: 'Error encountered during a runSpec mutation',
  definition (t) {
    t.nonNull.field('code', {
      type: RunSpecErrorCodeEnum,
    })

    t.string('detailMessage', {
      description: 'Contextual information for the error (typically an expanded error message)',
    })
  },
})
