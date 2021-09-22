import { objectType } from 'nexus'
import { App } from './App'
import { NavigationMenu } from './NavigationMenu'
import { Wizard } from './Wizard'

export const Query = objectType({
  name: 'Query',
  description: 'The root "Query" type containing all entry fields for our querying',
  definition (t) {
    t.nonNull.field('app', {
      type: App,
      resolve: (root, args, ctx) => ctx.coreData.app,
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

// @nxs.objectType({
//   description: 'The root "Query" type containing all entry fields for our querying',
// })
// export class Query {
//   @nxs.field.nonNull.type(() => App)
//   app (_: unknown, ctx: NexusGen['context']): NxsQueryResult<'app'> {
//     return ctx.app
//   }

//   @nxs.field.nonNull.type(() => Wizard, {
//     description: 'Metadata about the wizard, null if we arent showing the wizard',
//   })
//   wizard (args: unknown, ctx: NexusGenTypes['context']): NxsQueryResult<'wizard'> {
//     return ctx.wizard
//   }

//   @nxs.field.type(() => NavigationMenu, {
//     description: 'Metadata about the nagivation menu',
//   })
//   navigationMenu (args: unknown, ctx: NexusGenTypes['context']): NxsQueryResult<'navigationMenu'> {
//     return ctx.navigationMenu
//   }

//   cloudViewer (args: unknown, ctx: NxsCtx, info: GraphQLResolveInfo): Promise<NxsQueryResult<'cloudViewer'> | null> {
//     return ctx.delegateToRemoteQuery<'CloudUser'>(info)
//   }
// }
