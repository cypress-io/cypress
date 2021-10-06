import type { NavigationItem, NavigationMenu } from '../generated/test-graphql-types.gen'
import { NAV_ITEMS } from '@packages/types'
import type { MaybeResolver } from './clientTestUtils'

export const stubNavigationMenu: NavigationMenu = {
  __typename: 'NavigationMenu',
  items: NAV_ITEMS.map((navItem, index) => {
    return {
      __typename: 'NavigationItem',
      id: index.toString(),
      type: navItem.type,
      iconPath: navItem.iconPath,
      name: navItem.name,
      selected: index === 0,
    }
  }),
  selected: NAV_ITEMS[0].type,
}

export const stubNavigationItem: MaybeResolver<NavigationItem> = stubNavigationMenu.items[0]
