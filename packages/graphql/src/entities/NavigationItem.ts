import { nxs, NxsResult } from 'nexus-decorators'
import { NavItem, NavItemEnum } from '../constants'
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
  get name (): NxsResult<'NavigationItem', 'name'> {
    return this.navItemName
  }

  @nxs.field.nonNull.boolean()
  get selected (): NxsResult<'NavigationMenu', 'selected'> {
    return this.navigation.selected === this.navItemName
  }
}
