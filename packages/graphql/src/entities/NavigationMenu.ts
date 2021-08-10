import { nxs, NxsResult } from 'nexus-decorators'
import { NavItem, NavItemEnum, NAV_ITEM } from '../constants'
import { NavigationItem } from './NavigationItem'

@nxs.objectType({
  description: 'Container for state associated with the side navigation menu',
})
export class NavigationMenu {
  private _selected: NavItem = 'projectSetup'

  @nxs.field.nonNull.list.type(() => NavigationItem)
  get items (): NxsResult<'NavigationMenu', 'items'> {
    return NAV_ITEM.map((item) => new NavigationItem(this, item))
  }

  @nxs.field.nonNull.type(() => NavItemEnum)
  get selected (): NxsResult<'NavigationMenu', 'selected'> {
    return this._selected
  }
}
