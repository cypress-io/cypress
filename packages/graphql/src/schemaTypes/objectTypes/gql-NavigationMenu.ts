import { NAV_ITEMS } from '@packages/types'
import { objectType } from 'nexus'
import { NavItemEnum } from '../enumTypes/gql-WizardEnums'
import { NavigationItem } from './gql-NavigationItem'

export const NavigationMenu = objectType({
  name: 'NavigationMenu',
  description: 'Container for state associated with the side navigation menu',
  definition (t) {
    t.nonNull.list.nonNull.field('items', {
      type: NavigationItem,
      resolve: () => Array.from(NAV_ITEMS),
    })

    t.nonNull.field('selected', {
      type: NavItemEnum,
      resolve: (source, args, ctx) => ctx.appData.navItem,
    })
  },
})
