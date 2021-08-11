import { nxs, NxsArgs, NxsQueryResult, NxsResult } from 'nexus-decorators'
import type { NexusGenTypes } from '../gen/nxs.gen'
import { App } from './App'
import { NavigationMenu } from './NavigationMenu'
import { RunGroup } from './run'
import { User } from './User'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'The root "Query" type containing all entry fields for our querying',
})
export class Query {
  @nxs.field.nonNull.type(() => App)
  app (_: unknown, ctx: NexusGen['context']): NxsQueryResult<'app'> {
    return ctx.app
  }

  @nxs.field.type(() => Wizard, {
    description: 'Metadata about the wizard, null if we arent showing the wizard',
  })
  wizard (args: unknown, ctx: NexusGenTypes['context']): NxsResult<'App', 'wizard'> {
    return ctx.wizard
  }

  @nxs.field.type(() => NavigationMenu, {
    description: 'Metadata about the nagivation menu',
  })
  navigationMenu (args: unknown, ctx: NexusGenTypes['context']): NxsResult<'App', 'navigationMenu'> {
    return ctx.navigationMenu
  }

  @nxs.field.type(() => User, {
    description: 'Namespace for user and authentication',
  })
  user (args: unknown, ctx: NexusGenTypes['context']): NxsResult<'App', 'user'> {
    return ctx.user ?? null
  }

  @nxs.field.nonNull.list.type(() => RunGroup, {
    description: 'Get runs for a given projectId on Cypress Cloud',
    args (t) {
      t.nonNull.string('projectId')
    },
  })
  async runs (args: NxsArgs<'Query', 'runs'>, ctx: NexusGenTypes['context']): Promise<NxsResult<'App', 'runs'>> {
    return await ctx.actions.getRuns({ projectId: args.projectId })
  }
}
