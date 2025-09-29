import { STUDIO_STATUSES } from '@packages/types'
import { enumType } from 'nexus'

export const StudioStatusTypeEnum = enumType({
  name: 'StudioStatusType',
  members: STUDIO_STATUSES,
})
