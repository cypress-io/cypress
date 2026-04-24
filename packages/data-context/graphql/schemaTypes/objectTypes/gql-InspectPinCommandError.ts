import { objectType } from 'nexus'
import { InspectPinCommandErrorCodeEnum } from '../enumTypes'

export const InspectPinCommandError = objectType({
  name: 'InspectPinCommandError',
  description: 'Error encountered during an inspectPinCommand mutation.',
  definition (t) {
    t.nonNull.field('code', {
      type: InspectPinCommandErrorCodeEnum,
    })

    t.string('detailMessage', {
      description: 'Contextual information for the error.',
    })
  },
})
