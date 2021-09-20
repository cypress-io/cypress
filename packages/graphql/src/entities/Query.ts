import type { GraphQLResolveInfo } from 'graphql'
import { nxs, NxsCtx, NxsQueryResult } from 'nexus-decorators'
import type { BaseContext } from '..'
import type { NexusGenTypes } from '../gen/nxs.gen'
import { Browser } from './Browser'
import { NavigationMenu } from './NavigationMenu'
import { Project } from './Project'
import { Wizard } from './Wizard'

@nxs.objectType({
  description: 'The root "Query" type containing all entry fields for our querying',
})
export class Query {
  constructor (private ctx: BaseContext) {}

  @nxs.field.nonNull.string({
    description: 'See if the GraphQL server is alive',
  })
  get healthCheck (): NxsQueryResult<'healthCheck'> {
    return 'OK'
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the app is in global mode or not',
  })
  get isInGlobalMode (): NxsQueryResult<'isInGlobalMode'> {
    const hasGlobalModeArg = this.ctx.launchArgs.global ?? false
    const isMissingActiveProject = !this.ctx.activeProject

    return hasGlobalModeArg || isMissingActiveProject
  }

  @nxs.field.type(() => Project, {
    description: 'Active project',
  })
  get activeProject (): NxsQueryResult<'activeProject'> {
    // TODO: Figure out how to model project and dashboard project relationship
    return this.ctx.localProjects[0]!
  }

  @nxs.field.nonNull.type(() => Wizard, {
    description: 'Metadata about the wizard, null if we arent showing the wizard',
  })
  wizard (args: unknown, ctx: NexusGenTypes['context']): NxsQueryResult<'wizard'> {
    return ctx.wizard
  }

  @nxs.field.type(() => NavigationMenu, {
    description: 'Metadata about the nagivation menu',
  })
  navigationMenu (args: unknown, ctx: NexusGenTypes['context']): NxsQueryResult<'navigationMenu'> {
    return ctx.navigationMenu
  }

  @nxs.field.nonNull.list.nonNull.type(() => Project, {
    description: 'All known projects for the app',
  })
  get projects (): NxsQueryResult<'projects'> {
    return this.ctx.localProjects
  }

  @nxs.field.nonNull.list.nonNull.type(() => Browser, {
    description: 'Browsers found that are compatible with Cypress',
  })
  get browsers (): NxsQueryResult<'browsers'> {
    return this.ctx.browsers.map((x) => new Browser(x))
  }

  cloudViewer (args: unknown, ctx: NxsCtx, info: GraphQLResolveInfo): Promise<NxsQueryResult<'cloudViewer'> | null> {
    return ctx.delegateToRemoteQuery<'CloudUser'>(info)
  }
}
