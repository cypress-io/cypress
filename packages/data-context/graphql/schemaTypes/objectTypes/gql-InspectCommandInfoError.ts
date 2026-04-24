import { objectType } from 'nexus'
import { InspectCommandInfoErrorCodeEnum } from '../enumTypes'

export const InspectCommandInfoError = objectType({
  name: 'InspectCommandInfoError',
  description: 'Error encountered during an `inspectCommandInfo` query.',
  definition (t) {
    t.nonNull.field('code', {
      type: InspectCommandInfoErrorCodeEnum,
    })

    t.string('detailMessage', {
      description: 'Contextual information for the error.',
    })
  },
})
