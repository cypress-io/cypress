import { objectType } from 'nexus'
import { App } from './gql-App'
import { NavigationMenu } from './gql-NavigationMenu'
import { Wizard } from './gql-Wizard'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.nonNull.field('app', {
      type: App,
      resolve: (root, args, ctx) => ctx.appData,
    })

    t.field('navigationMenu', {
      type: NavigationMenu,
      description: 'Metadata about the nagivation menu',
    })

    t.nonNull.field('wizard', {
      type: Wizard,
      description: 'Metadata about the wizard, null if we arent showing the wizard',
      resolve: (root, args, ctx) => ctx.coreData.wizard,
    })
  },
})
