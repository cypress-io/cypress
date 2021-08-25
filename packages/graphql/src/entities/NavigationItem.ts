import { nxs, NxsResult } from 'nexus-decorators'
import { NavItem, NavItemEnum, NAV_ITEM_INFO } from '../constants'
import type { NavigationMenu } from './NavigationMenu'

@nxs.objectType({
  description: 'Container describing a single nav item',
})
export class NavigationItem {
  constructor (
    private navigation: NavigationMenu,
    private navItemName: NavItem,
  ) {}

  @nxs.field.nonNull.type(() => NavItemEnum)
  get id (): NxsResult<'NavigationItem', 'id'> {
    return this.navItemName
  }

  @nxs.field.nonNull.boolean()
  get selected (): NxsResult<'NavigationItem', 'selected'> {
    return this.navigation.selected === this.id
  }

  @nxs.field.nonNull.string()
  get iconPath (): NxsResult<'NavigationItem', 'iconPath'> {
    return NAV_ITEM_INFO[this.navItemName].iconPath
  }

  @nxs.field.nonNull.string()
  get name (): NxsResult<'NavigationItem', 'name'> {
    return NAV_ITEM_INFO[this.navItemName].displayName
  }
}
