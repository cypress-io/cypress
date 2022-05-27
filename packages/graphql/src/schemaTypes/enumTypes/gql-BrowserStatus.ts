import { BROWSER_STATUS } from '@packages/types'
import { enumType } from 'nexus'

export const BrowserStatusEnum = enumType({
  name: 'BrowserStatus',
  members: BROWSER_STATUS,
})
