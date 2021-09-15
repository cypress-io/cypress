import type { GraphQLResolveInfo } from 'graphql'
import { nxs, NxsCtx, NxsResult } from 'nexus-decorators'
import type { BaseContext } from '../context/BaseContext'
import type { ProjectContract } from '../contracts/ProjectContract'
import { ResolvedConfig } from './ResolvedConfig'

@nxs.objectType({
  description: 'A Cypress project is a container',
})
export class Project implements ProjectContract {
  _ctPluginsInitialized: boolean = false
  _e2ePluginsInitialized: boolean = false

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
    description: 'Whether the user configured this project to use Component Testing',
  })
  get isFirstTimeCT (): NxsResult<'LocalProject', 'isFirstTimeCT'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'component')
  }

  @nxs.field.nonNull.boolean({
    description: 'Whether the user configured this project to use e2e Testing',
  })
  get isFirstTimeE2E (): NxsResult<'LocalProject', 'isFirstTimeE2E'> {
    return this.ctx.actions.isFirstTime(this.projectRoot, 'e2e')
  }

  setE2EPluginsInitialized (init: boolean): void {
    this._e2ePluginsInitialized = init
  }

  get e2ePluginsInitialized (): boolean {
    return this._e2ePluginsInitialized
  }

  setCtPluginsInitialized (init: boolean): void {
    this._ctPluginsInitialized = init
  }

  get ctPluginsInitialized (): boolean {
    return this._ctPluginsInitialized
  }
}
