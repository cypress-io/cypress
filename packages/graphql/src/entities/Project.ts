import type { GraphQLResolveInfo } from 'graphql'
import { nxs, NxsCtx, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  constructor (private _projectRoot: string, protected ctx: BaseContext) {}

  @nxs.field.nonNull.id()
  id (): NxsResult<'Project', 'id'> {
    return this.projectRoot
  }

  @nxs.field.nonNull.string()
  title (): NxsResult<'Project', 'title'> {
    return 'Title'
  }

  @nxs.field.string({
    description: 'Used to associate project with Cypress cloud',
  })
  async projectId (): Promise<NxsResult<'Project', 'projectId'>> {
    try {
      return await this.ctx.actions.getProjectId(this.projectRoot)
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)

      return null
    }
  }

  @nxs.field.nonNull.string()
  get projectRoot (): NxsResult<'Project', 'projectRoot'> {
    return this._projectRoot
  }

  @nxs.field.type(() => ResolvedConfig)
  resolvedConfig (): NxsResult<'Project', 'resolvedConfig'> {
    const cfg = this.ctx.actions.resolveOpenProjectConfig()

    if (!cfg) {
      throw Error('openProject.getConfig is null. Have you initialized the current project?')
    }

    return new ResolvedConfig(cfg.resolved)
  }

  @nxs.field.type(() => 'CloudProject')
  cloudProject (args: unknown, ctx: NxsCtx, info: GraphQLResolveInfo): NxsResult<'Project', 'cloudProject'> {
    return this.ctx.delegateToRemoteQuery(info) as any
  }

  @nxs.field.nonNull.boolean({
    description: `Whether the user has configured component testing. Based on the existance of a 'component' key in their cypress.json`,
  })
  get hasSetupComponentTesting (): NxsResult<'Project', 'hasSetupComponentTesting'> {
    // default is {}
    // assume if 1 or more key has been configured, CT has been setup
    let config: ReturnType<Project['resolvedConfig']>

    if (!(config = this.resolvedConfig())) {
      return false
    }

    // default is {}
    // assume if 1 or more key has been configured, CT has been setup
    return Object.keys(config.resolvedConfig.component?.value).length > 0 ?? false
  }

  @nxs.field.nonNull.boolean({
    description: `Whether the user has configured e2e testing or not, based on the existance of a 'component' key in their cypress.json`,
  })
  get hasSetupE2ETesting (): NxsResult<'Project', 'hasSetupE2ETesting'> {
    let config: ReturnType<Project['resolvedConfig']>

    if (!(config = this.resolvedConfig())) {
      return false
    }

    // default is {}
    // assume if 1 or more key has been configured, E2E has been setup
    return Object.keys(config.resolvedConfig.e2e?.value).length > 0 ?? false
  }
}
