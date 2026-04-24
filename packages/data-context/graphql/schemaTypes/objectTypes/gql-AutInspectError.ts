import { objectType } from 'nexus'
import { AutInspectErrorCodeEnum } from '../enumTypes'

export const AutInspectError = objectType({
  name: 'AutInspectError',
  description: 'Error encountered when reading the AUT via `autInspect` or `autInspectDom`.',
  definition (t) {
    t.nonNull.field('code', {
      type: AutInspectErrorCodeEnum,
    })

    t.string('detailMessage', {
      description: 'Contextual information for the error.',
    })
  },
})
