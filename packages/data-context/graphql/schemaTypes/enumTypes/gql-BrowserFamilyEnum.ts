import { BROWSER_FAMILY } from '@packages/types'
import { enumType } from 'nexus'

export const BrowserFamilyEnum = enumType({
  name: 'BrowserFamily',
  members: BROWSER_FAMILY,
})
