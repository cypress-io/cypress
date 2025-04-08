import { STUDIO_STATUSES } from '@packages/types'
import { enumType, objectType } from 'nexus'

export const StudioStatusTypeEnum = enumType({
  name: 'StudioStatusType',
  members: STUDIO_STATUSES,
})

export const Studio = objectType({
  name: 'Studio',
  description: 'The studio manager for the app',
  definition (t) {
    t.field('status', {
      type: StudioStatusTypeEnum,
      description: 'The current status of the studio',
    })
  },
})
