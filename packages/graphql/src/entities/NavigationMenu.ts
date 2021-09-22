import { objectType } from 'nexus'
import { NavItemEnum } from '../constants'
import { NavigationItem } from './NavigationItem'

export const NavigationMenu = objectType({
  name: 'NavigationMenu',
  description: 'Container for state associated with the side navigation menu',
  definition (t) {
    t.nonNull.list.nonNull.field('items', {
      type: NavigationItem,
    })

    t.nonNull.field('selected', {
      type: NavItemEnum,
    })
  },
})

// @nxs.objectType({
//   description: 'Container for state associated with the side navigation menu',
// })
// export class NavigationMenu {
//   private _selected: NavItem = 'projectSetup'

//   @nxs.field.nonNull.list.nonNull.type(() => NavigationItem)
//   get items (): NxsResult<'NavigationMenu', 'items'> {
//     return NAV_ITEM.map((item) => new NavigationItem(this, item))
//   }

//   @nxs.field.nonNull.type(() => NavItemEnum)
//   get selected (): NxsResult<'NavigationMenu', 'selected'> {
//     return this._selected
//   }

//   // Internal Setters:

//   setSelectedItem (item: NavItem): NavigationMenu {
//     this._selected = item

//     return this
//   }
// }
