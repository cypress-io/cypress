import { objectType } from 'nexus'
import { StudioInitErrorCodeEnum } from '../enumTypes'

export const StudioInitError = objectType({
  name: 'StudioInitError',
  description: 'Error encountered during a studioInitTest mutation',
  definition (t) {
    t.nonNull.field('code', {
      type: StudioInitErrorCodeEnum,
    })

    t.string('detailMessage', {
      description: 'Contextual information for the error',
    })
  },
})
