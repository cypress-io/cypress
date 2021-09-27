import { objectType } from 'nexus'
import { NavItemEnum } from '../enumTypes/gql-WizardEnums'

export const NavigationItem = objectType({
  name: 'NavigationItem',
  description: 'Container describing a single nav item',
  node: 'type',
  definition (t) {
    t.nonNull.field('type', {
      type: NavItemEnum,
    })

    t.nonNull.string('iconPath')
    t.nonNull.string('name')

    t.nonNull.boolean('selected', {
      resolve: (source, args, ctx) => ctx.appData.navItem === source.type,
    })
  },
})
