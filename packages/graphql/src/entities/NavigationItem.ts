import { objectType } from 'nexus'
import { NavItemEnum, NAV_ITEM_INFO } from '../constants'

export const NavigationItem = objectType({
  name: 'NavigationItem',
  description: 'Container describing a single nav item',
  definition (t) {
    t.nonNull.field('id', {
      type: NavItemEnum,
      resolve: (source) => source,
    })

    t.nonNull.string('iconPath', {
      resolve: (source) => NAV_ITEM_INFO[source].iconPath,
    })

    t.nonNull.string('name', {
      resolve: (source) => NAV_ITEM_INFO[source].displayName,
    })

    t.nonNull.boolean('selected', {
      resolve: (source, args, ctx) => ctx.app.navItem === source,
    })
  },
  sourceType: {
    module: '@packages/graphql/src/constants',
    export: 'NavItem',
  },
})
