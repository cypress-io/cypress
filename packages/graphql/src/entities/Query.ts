import { nxs, NxsQueryResult, NxsResult } from 'nexus-decorators'
import type { NexusGenTypes } from '../gen/nxs.gen'
import { App } from './App'
import { NavigationMenu } from './NavigationMenu'
import { Viewer } from './Viewer'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'The root "Query" type containing all entry fields for our querying',
})
export class Query {
  @nxs.field.nonNull.type(() => App)
  app (_: unknown, ctx: NexusGen['context']): NxsQueryResult<'app'> {
    return ctx.app
  }

  @nxs.field.type(() => Viewer, {
    description: 'Namespace for data accessible from Cypress Cloud for authenticated users',
  })
  viewer (args: unknown, ctx: NexusGenTypes['context']): NxsQueryResult<'viewer'> {
    return ctx.viewer ?? null
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
}
