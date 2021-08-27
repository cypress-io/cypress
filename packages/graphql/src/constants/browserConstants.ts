import { enumType } from 'nexus'
import { BROWSER_FAMILY } from '@packages/types/src/browser'

export const BrowserFamilyEnum = enumType({
  name: 'BrowserFamily',
  members: BROWSER_FAMILY,
})
