import { enumType } from 'nexus'
import { BROWSER_FAMILY } from '@packages/launcher/lib/types'

export const BrowserFamilyEnum = enumType({
  name: 'BrowserFamily',
  members: BROWSER_FAMILY,
})
